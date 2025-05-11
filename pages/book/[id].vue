<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

const book = ref(null);
const route = useRoute();

// Fetch the book details on component mount
onMounted(async () => {
  const bookId = route.params.id; // Get book ID from route parameter
  try {
    const res = await fetch(BASEURL + `/book.php?id=${bookId}`);
    const data = await res.json();
    if (data.error) {
      console.error(data.error);
    } else {
      book.value = data;
    }
  } catch (error) {
    console.error("Error fetching book:", error);
  }
});
</script>

<template>
  <div v-if="book">
    <h1>{{ book.title }}</h1>
    <p><strong>Author:</strong> {{ book.author_name }}</p>
    <p><strong>Created on:</strong> {{ book.created_at }}</p>
    <div v-html="book.content"></div>

    <!-- Display book cover if available -->
    <div v-if="book.cover">
      <img :src="book.cover" alt="Book Cover" style="max-width: 300px" />
    </div>
  </div>

  <!-- Loading state -->
  <div v-else>
    <p>Loading...</p>
  </div>
</template>
