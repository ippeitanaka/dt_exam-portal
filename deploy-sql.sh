#!/bin/bash

# ranking_functions.sql の内容を直接実行するスクリプト

echo "Ranking functions SQLを実行中..."

# get_test_rankings関数を作成
curl -X POST \
  'https://kmmdtugozluadecsgvpk.supabase.co/rest/v1/query' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR0dWdvemx1YWRlY3NndnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTcyNywiZXhwIjoyMDY5MDAxNzI3fQ.extYSeJv9j1iVXM22X8pdpXbwjnNsY1tcx6o8NcNFmo' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR0dWdvemx1YWRlY3NndnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTcyNywiZXhwIjoyMDY5MDAxNzI3fQ.extYSeJv9j1iVXM22X8pdpXbwjnNsY1tcx6o8NcNFmo' \
  -H 'Content-Type: text/plain' \
  --data-binary @db/ranking_functions.sql

echo "実行完了"
