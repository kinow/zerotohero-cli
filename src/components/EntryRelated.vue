<template>
  <div class="container" :key="'related-' + relatedKey">
    <div class="row mt-5" v-if="words && words.length > 0">
      <div class="col-sm-12">
        <div class="widget-title mb-2">Words related to “{{ entry.simplified }}”</div>
        <WordList :words="words" class="related" :compareWith="entry" collapse="10" />
      </div>
    </div>
  </div>
</template>
<script>
import SketchEngine from '@/lib/sketch-engine'
import Helper from '@/lib/helper'

export default {
  props: ['entry'],
  data() {
    return {
      Helper,
      words: [],
      relatedKey: 0
    }
  },
  async mounted() {
    let response = await SketchEngine.thesaurus(this.entry.simplified)
    if (response) {
      this.words = []
      for (let Word of response.Words) {
        let words = await (await this.$dictionary).lookupSimplified(Word.word)
        if (words.length > 0) {
          let word = words[0]
          this.words.push(word)
        }
      }
    }
  }
}
</script>

<style>
.related {
  list-style: none;
  padding: 0;
  columns: 2;
}

.related .saved-words.collapsed li {
  display: block;
}

.related .saved-words.collapsed li:nth-child(n + 11) {
  display: none;
}

@media (max-width: 768px) {
  .related {
    column-count: 1;
  }
}

.related.collapsed li:nth-child(n + 13) {
  display: none;
}
</style>
