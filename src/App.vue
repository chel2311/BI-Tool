<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-primary-500 text-white shadow-lg">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v8H3v-8zm4-5h2v13H7V8zm4-5h2v18h-2V3zm4 8h2v10h-2V11zm4-3h2v13h-2V8z"/>
          </svg>
          <h1 class="text-xl font-bold">Browser BI Tool</h1>
        </div>
        <nav class="flex items-center space-x-4">
          <router-link to="/" class="hover:text-primary-200 transition-colors">
            ホーム
          </router-link>
          <router-link to="/analysis" class="hover:text-primary-200 transition-colors">
            分析
          </router-link>
          <router-link to="/dashboard" class="hover:text-primary-200 transition-colors">
            ダッシュボード
          </router-link>
        </nav>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="container mx-auto px-4 py-6">
      <router-view />
    </main>

    <!-- フッター -->
    <footer class="bg-gray-800 text-gray-400 py-4 mt-auto">
      <div class="container mx-auto px-4 text-center text-sm">
        <p>Browser BI Tool - データ可視化・分析ツール</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// グローバル設定やイベントハンドラ
</script>
