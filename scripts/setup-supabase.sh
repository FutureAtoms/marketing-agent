#!/bin/bash

# Supabase Setup Script for Marketing App
# ========================================

set -e

echo "🚀 Marketing App - Supabase Setup"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if project reference is provided
if [ -z "$1" ]; then
    echo "📋 To use this script, you need to:"
    echo ""
    echo "1. Go to https://app.supabase.com"
    echo "2. Click 'New Project'"
    echo "3. Fill in:"
    echo "   - Name: marketing-app"
    echo "   - Database Password: (save this securely!)"
    echo "   - Region: Choose closest to you"
    echo "4. Wait for project to be created (~2 mins)"
    echo "5. Copy the project reference ID (from URL or Settings > General)"
    echo ""
    echo "Then run: ./scripts/setup-supabase.sh <project-ref>"
    echo ""
    echo "Example: ./scripts/setup-supabase.sh abcdefghijklmnop"
    exit 0
fi

PROJECT_REF=$1

echo "📦 Linking to project: $PROJECT_REF"
echo ""

# Link to the project
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "✅ Project linked successfully!"
echo ""

# Push database migrations
echo "📊 Pushing database migrations..."
supabase db push

echo ""
echo "✅ Migrations applied successfully!"
echo ""

# Get project credentials
echo "🔑 Getting project credentials..."
echo ""

# Display connection info
supabase status

echo ""
echo "=================================="
echo "🎉 Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Copy the 'API URL' and 'anon key' above to your .env file:"
echo "   EXPO_PUBLIC_SUPABASE_URL=<API URL>"
echo "   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. (Optional) View your database:"
echo "   - Go to https://app.supabase.com"
echo "   - Select your project"
echo "   - Click 'Table Editor'"
echo ""
