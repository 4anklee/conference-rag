# Step 1: Fork & Deploy — 🏁 "I Have a Site!"

```
  ▶ 🏁 LAUNCH ──→ 🔐 SIGN IN ──→ 🔍 KEYWORD ──→ 🧠 SEMANTIC ──→ 🤖 RAG ──→ 🚀 YOURS
    ~~~~~~~~
    YOU ARE HERE
```

## What You'll Learn
- How forking works in Git and open-source workflows
- How static site hosting works with GitHub Pages
- How to manage secrets in a project

## Why This Matters

Before building backend features, you want to **see something**. Deploying first means every change you make from here on out is visible on your live site. This is how real developers work — deploy early, iterate often.

## What to Do

### 1. Fork the Repository

1. Go to: **https://github.com/byu-cs-452/conference-rag**
2. Click **"Fork"** in the top right → **"Create fork"**
3. Make sure your fork is **public** (required for free GitHub Pages hosting)

You now have your own copy at: `https://github.com/YOUR-USERNAME/conference-rag`

> 💡 **Why fork?** Forking is a fundamental open-source workflow. Your fork is your own copy that you can freely modify.

### 2. Clone Your Fork Locally

```bash
git clone https://github.com/YOUR-USERNAME/conference-rag.git
cd conference-rag
```

### 3. Set Up Python Environment

```bash
uv sync
```

### 4. Set Up Config Files

You have two configuration files with different purposes:

| File | Contains | Safe to Commit? |
|------|---------|:-:|
| `config.public.json` | Supabase URL + anon key | ✅ Yes — protected by RLS |
| `config.secret.json` | API keys, service keys | ❌ Never — git-ignored |

Create your secret config from the template:

```bash
cp config.secret.example.json config.secret.json
```

`config.public.json` already exists with placeholder values — you'll fill it in during the next step.

> ⚠️ **`config.secret.json` is in `.gitignore`** — it will never be committed to your repo. This is how we keep API keys safe!

> 💡 **Ask your AI assistant**: *"Why is the Supabase anon key safe to expose publicly, but the service key is not?"*

### 5. Enable GitHub Pages

1. Go to your repository on GitHub (**your fork**, not the original)
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under "Source", select **Deploy from a branch**
4. Set Branch: **main**, Folder: **/ (root)**
5. Click **Save**
6. Wait ~1 minute, then refresh — you'll see your deployment URL

Your site will be live at: `https://YOUR-USERNAME.github.io/conference-rag/`

> 💡 Visit your site now! You should see the Conference Q&A interface with a "Setup Required" banner. That's expected — you'll configure it in the next step.

## Verification

- [ ] You have your own fork on GitHub
- [ ] Repo is cloned locally
- [ ] `uv sync` completed without errors
- [ ] `config.public.json` and `config.secret.json` exist (with placeholder values)
- [ ] Site is live at your GitHub Pages URL (with setup banner)

## 🎉 Milestone: You have a live website!

## → Next: [Step 02: Supabase & Login](02_supabase_and_login.md)
