import { execSync } from 'child_process';
const value = 'mongodb+srv://contactconnexus360_db_user:aljnLuLJCLFI8EPt@broadcast.ctzpgmj.mongodb.net/broadcast?retryWrites=true&w=majority';
execSync(`npx vercel env add MONGO_URI production <<< "${value}"`, { stdio: 'inherit', cwd: process.cwd() });
