import path from 'path';
import fs from 'fs';
import { ensureUserStore, findUser, findUserByName, upsertUser, deleteUser, isBlacklisted } from './backend/userStore';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: path.resolve(__dirname, 'frontend'),
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'auth-api',
          configureServer(server) {
            ensureUserStore();
            const readJsonBody = async (req) => {
              return await new Promise((resolve) => {
                let data = '';
                req.on('data', (chunk) => { data += chunk; });
                req.on('end', () => {
                  try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
                });
              });
            };
            server.middlewares.use('/api/auth/google/verify', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const idToken = body.idToken;
              if (!idToken) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_token' })); return; }
              if (!env.GOOGLE_CLIENT_ID) { res.statusCode = 500; res.end(JSON.stringify({ error: 'missing_google_client_id' })); return; }
              try {
                const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
                if (!r.ok) { res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_token' })); return; }
                const j = await r.json();
                if (j.aud !== env.GOOGLE_CLIENT_ID) { res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_audience' })); return; }
                const payload = { provider: 'google', providerId: j.sub, name: j.name || '', email: j.email || '', avatarUrl: j.picture || '' };
                res.end(JSON.stringify(payload));
              } catch (e) {
                res.statusCode = 500; res.end(JSON.stringify({ error: 'server_error' }));
              }
            });
            server.middlewares.use('/api/auth/facebook/verify', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const accessToken = body.accessToken;
              if (!accessToken) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_token' })); return; }
              if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) { res.statusCode = 500; res.end(JSON.stringify({ error: 'missing_facebook_app_config' })); return; }
              try {
                const appToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;
                const dbg = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`);
                if (!dbg.ok) { res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_token' })); return; }
                const dbgJson = await dbg.json();
                if (!dbgJson?.data?.is_valid) { res.statusCode = 401; res.end(JSON.stringify({ error: 'invalid_token' })); return; }
                const info = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`);
                if (!info.ok) { res.statusCode = 401; res.end(JSON.stringify({ error: 'user_info_error' })); return; }
                const user = await info.json();
                const payload = { provider: 'facebook', providerId: user.id, name: user.name || '', email: user.email || '', avatarUrl: user.picture?.data?.url || '' };
                res.end(JSON.stringify(payload));
              } catch (e) {
                res.statusCode = 500; res.end(JSON.stringify({ error: 'server_error' }));
              }
            });

            server.middlewares.use('/api/users/find', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const provider = body.provider;
              const identifier = body.identifier;
              if (!provider || !identifier) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_params' })); return; }
              const found = findUser(provider, identifier);
              res.end(JSON.stringify({ found: !!found, profile: found }));
            });

            server.middlewares.use('/api/users/publicByName', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const name = (body?.name || '').trim();
              if (!name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_name' })); return; }
              const found = findUserByName(name);
              if (!found) { res.end(JSON.stringify({ found: false })); return; }
              const publicProfile = {
                id: found.id,
                name: found.name,
                provider: found.provider,
                providerId: found.providerId,
                dateOfBirth: found.dateOfBirth,
                bio: found.bio,
                links: found.links,
                contactEmail: found.contactEmail,
                contactFacebookUrl: found.contactFacebookUrl,
                phoneNumber: found.phoneNumber,
                cvFilePath: found.cvFilePath,
                portfolioFilePath: found.portfolioFilePath,
              };
              res.end(JSON.stringify({ found: true, profile: publicProfile }));
            });

            server.middlewares.use('/api/users/upsert', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const p = body?.profile;
              if (!p?.provider || !(p?.providerId) || !p?.id || !p?.name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid_profile' })); return; }
              if (isBlacklisted(p.providerId)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'identifier_blacklisted' })); return; }
              try {
                const saved = upsertUser(p);
                res.end(JSON.stringify(saved));
              } catch (e: any) {
                res.statusCode = 403; res.end(JSON.stringify({ error: e?.message || 'upsert_failed' }));
              }
            });

            server.middlewares.use('/api/users/delete', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const provider = body?.provider;
              const identifier = body?.identifier;
              if (!provider || !identifier) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_params' })); return; }
              const ok = deleteUser(provider, identifier);
              if (!ok) { res.statusCode = 404; res.end(JSON.stringify({ error: 'user_not_found' })); return; }
              res.end(JSON.stringify({ deleted: true }));
            });

            server.middlewares.use('/api/upload', async (req, res, next) => {
              if (req.method !== 'POST') return next();
              res.setHeader('Content-Type', 'application/json');
              const body = await readJsonBody(req);
              const { userId, filename, contentBase64 } = body || {};
              if (!userId || !filename || !contentBase64) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_params' })); return; }
              try {
                const uploadDir = path.resolve(__dirname, 'backend', 'uploads', userId);
                fs.mkdirSync(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                const buffer = Buffer.from(contentBase64, 'base64');
                fs.writeFileSync(filePath, buffer);
                const relativePath = path.relative(path.resolve(__dirname), filePath);
                const url = '/uploads/' + [userId, filename].join('/');
                res.end(JSON.stringify({ path: relativePath, url }));
              } catch (e) {
                res.statusCode = 500; res.end(JSON.stringify({ error: 'upload_failed' }));
              }
            });

            server.middlewares.use('/uploads', async (req, res, next) => {
              if (req.method !== 'GET') return next();
              const u = (req.url || '/').split('?')[0];
              const parts = u.split('/').filter(Boolean);
              // Mounted at /uploads, so req.url is '/:userId/:filename'
              if (parts.length >= 1) {
                const userId = parts[0];
                const filename = parts.slice(1).join('/') || '';
                const filePath = path.resolve(__dirname, 'backend', 'uploads', userId, filename);
                try {
                  if (!fs.existsSync(filePath)) { res.statusCode = 404; res.end('Not found'); return; }
                  const stream = fs.createReadStream(filePath);
                  const lower = filename.toLowerCase();
                  const type = lower.endsWith('.png') ? 'image/png'
                    : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg'
                    : lower.endsWith('.webp') ? 'image/webp'
                    : lower.endsWith('.gif') ? 'image/gif'
                    : lower.endsWith('.svg') ? 'image/svg+xml'
                    : lower.endsWith('.bmp') ? 'image/bmp'
                    : lower.endsWith('.tif') || lower.endsWith('.tiff') ? 'image/tiff'
                    : lower.endsWith('.ico') ? 'image/x-icon'
                    : lower.endsWith('.avif') ? 'image/avif'
                    : lower.endsWith('.heic') ? 'image/heic'
                    : 'application/octet-stream';
                  res.setHeader('Content-Type', type);
                  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                  stream.pipe(res);
                } catch (e) {
                  res.statusCode = 500; res.end('Server error');
                }
                return;
              }
              return next();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
        'process.env.FACEBOOK_APP_ID': JSON.stringify(env.FACEBOOK_APP_ID),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
        'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'frontend'),
        }
      }
    };
});
