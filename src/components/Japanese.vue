<template>
  <div class="japanese">
    <div class="widget-title">Learning Japanese?</div>
    <div class="jumbotron-fluid bg-light p-4">
      <div v-if="words">
        <div v-for="word in words">
          <div>
            The Japanese word
            <a
              :href="`#/en/ja/dictionary/edict/${word.id}`"
              class="link-unstyled"
              target="_blank"
            >
              <b :data-level="hsk" class="bigger">{{ word.kanji }}</b> ({{
                word.kana
              }})</a
            >
            means
            <em>{{
              word.english
                .replace(/\(.*?\)/g, '')
                .replace(/\//g, ', ')
                .trim()
                .replace(/,$/, '')
            }}</em
            >.
          </div>
        </div>
      </div>
      <div v-if="!words || words.length === 0">
        We could not find any Japanese words with the <em>kanji</em> “{{
          shinjitai ? shinjitai : text
        }}.”
      </div>
    </div>
  </div>
</template>

<script>
import Config from '@/lib/config'

export default {
  props: {
    text: {
      type: String
    },
    hsk: {
      default: 'outside'
    }
  },
  data() {
    return {
      words: [],
      shinjitai: undefined
    }
  },
  async created() {
    let variants = await (await this.$unihan).variants(this.text)
    for (let variant of variants) {
      let kyujitai = new Kyujitai(error => {
        this.shinjitai = kyujitai.decode(variant)
        if (this.shinjitai) {
          $.getJSON(
            `${Config.wiki}items/edict?filter[kanji][eq]=${this.shinjitai}`,
            response => {
              if (response.data.length > 0) {
                let data = response.data.filter(row => {
                  return !this.words.find(word => word.kanji === row.kanji) // Make sure it's unique (2 kyujitai variants might turn out to be the same shinjitai)
                })
                this.words = this.words.concat(data)
              }
            }
          )
        }
      })
    }

  }
}
</script>

<style></style>
