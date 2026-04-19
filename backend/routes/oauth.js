import { Router } from 'express';

export const oauthRouter = Router();

// GitHub OAuth callback — exchanges code for access token
oauthRouter.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[oauth] Token exchange failed:', tokenData.error);
      return res.status(400).json({ error: tokenData.error_description });
    }

    // Fetch user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    console.log(`[oauth] User authenticated: ${user.login}`);

    // Redirect to dashboard with user info (the dashboard will handle session)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      login: user.login,
      avatar: user.avatar_url || '',
      token: tokenData.access_token,
    });
    res.redirect(`${appUrl}/api/auth/callback?${params}`);
  } catch (err) {
    console.error('[oauth] Error:', err);
    res.status(500).json({ error: 'OAuth failed' });
  }
});
