#!/bin/bash

# Setup script for deploying AccelMonitor to Vercel

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== AccelMonitor - Setup for Vercel Deployment ===${NC}"
echo

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git first.${NC}"
    exit 1
fi

# Check if current directory is the project root
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}Error: This script should be run from the accel-monitor project root directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}This script will help you set up your AccelMonitor app for deployment to Vercel.${NC}"
echo

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${BLUE}Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}Git repository initialized!${NC}"
else
    echo -e "${YELLOW}Git repository already initialized.${NC}"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo -e "${BLUE}Creating .gitignore file...${NC}"
    cat > .gitignore << 'EOL'
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# firebase
serviceAccountKey.json
*serviceAccountKey.json
firebase-adminsdk-*.json

# security
*.key
*.pem
*.crt
*.cert
EOL
    echo -e "${GREEN}.gitignore created!${NC}"
else
    echo -e "${YELLOW}.gitignore already exists.${NC}"
fi

# Ask for GitHub repository details
echo
echo -e "${BLUE}Enter your GitHub username:${NC}"
read github_username

if [ -z "$github_username" ]; then
    echo -e "${RED}GitHub username is required. Exiting.${NC}"
    exit 1
fi

echo -e "${BLUE}Enter your GitHub repository name (default: accel-monitor):${NC}"
read github_repo
github_repo=${github_repo:-accel-monitor}

# Stage files for commit
echo
echo -e "${BLUE}Staging files for commit...${NC}"
git add .
echo -e "${GREEN}Files staged!${NC}"

# Commit changes
echo
echo -e "${BLUE}Committing changes...${NC}"
git commit -m "Prepare for Vercel deployment"
echo -e "${GREEN}Changes committed!${NC}"

# Add remote repository
echo
echo -e "${BLUE}Adding GitHub remote repository...${NC}"
git remote add origin https://github.com/$github_username/$github_repo.git
echo -e "${GREEN}Remote repository added!${NC}"

# Push to GitHub
echo
echo -e "${YELLOW}Ready to push to GitHub. Before continuing:${NC}"
echo "1. Make sure you've created a repository named '$github_repo' on GitHub"
echo "2. Ensure you're authenticated with GitHub on this machine"
echo
echo -e "${BLUE}Push to GitHub now? (y/n)${NC}"
read push_confirm

if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    echo -e "${BLUE}Pushing to GitHub...${NC}"
    git branch -M main
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully pushed to GitHub!${NC}"
        echo
        echo -e "${BLUE}Next steps for Vercel deployment:${NC}"
        echo "1. Go to https://vercel.com and sign in with your GitHub account"
        echo "2. Click 'Add New Project' and select your '$github_repo' repository"
        echo "3. Vercel should automatically detect Next.js configuration"
        echo "4. Add any additional environment variables if needed"
        echo "5. Click 'Deploy'"
        echo
        echo -e "${BLUE}For custom domain setup:${NC}"
        echo "1. After deployment, go to your project settings in Vercel"
        echo "2. Navigate to 'Domains' and add your custom domain"
        echo "3. Follow Vercel's instructions to configure DNS settings"
    else
        echo -e "${RED}Failed to push to GitHub. Please check your credentials and try again manually.${NC}"
    fi
else
    echo -e "${YELLOW}Skipped pushing to GitHub. You can push manually later with:${NC}"
    echo "  git branch -M main"
    echo "  git push -u origin main"
fi

echo
echo -e "${GREEN}Setup completed! Your AccelMonitor app is ready for Vercel deployment.${NC}" 