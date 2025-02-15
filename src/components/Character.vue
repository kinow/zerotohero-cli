<template>
  <div class="character">
    <!-- ANCHOR img/anchors/parts.png -->
    <div>
      <div class="text-center mr-4 mb-4" style="float: left">
        <div class="pinyin mb-2" v-if="pinyin">{{ pinyin }}</div>
        <StrokeOrder :char="character.character" />
      </div>
      <div class="mb-4" style="overflow: hidden; position: relative;">
        <h6>Character Definitions</h6>
        <DefinitionsList class="mt-2" :definitions="character.definition.split(';')"></DefinitionsList>
      </div>
    </div>
    <hr style="clear: both" />
    <div>
      <Decomposition :char="character.character" class="mb-4 mr-4" style="float: left; clear: left"></Decomposition>
      <div class="character-parts" style="overflow: hidden; position: relative;">
        <h6>Character Decomposition</h6>
        <div class="part character-example" v-for="part in character.parts">
          <span class="part-part mr-2" v-if="part && part.character !== '？'">
            <b>{{ part.character }}</b> =
          </span>
          <span
            class="part-definition character-example-english"
            v-if="part.definition"
          >{{ part.definition }}</span>
          <!-- component example lookup works but can't seem to get the list to update -->
          <!-- <button
          v-if="!part.characters"
          class="btn btn-small"
          @click="getPartExamples(part)"
        >
          Characters
        </button>
        <span v-if="part.getting">Looking up characters...</span>
        {{ character.examples ? character.examples.length : '' }}
        <div
          v-for="character in part.characters"
          :key="`${character.character}-${charKey}`"
        >
          {{ character.examples }}
          <WordList
            v-if="character.examples"
            :words="character.examples"
            :highlight="character.character"
          />
          </div>-->
        </div>
        <div class="etymology" v-if="character.etymology">
          <span v-if="character.etymology.type">
            <b>Origin:</b> A
            <em v-if="character.etymology">{{ character.etymology.type }}</em>
            character.
          </span>
          <span v-if="character.etymology.hint">
            <b>Mnemonic:</b>
            {{ character.etymology.hint }}.
          </span>
        </div>
      </div>
    </div>
    <hr style="clear: both" />
    <h6 class="text-center">HSK Words with this Character</h6>
    <WordList :words="examples" :highlight="character.character" collapse="4" />
  </div>
</template>

<script>
import Decomposition from '@/components/Decomposition.vue'
import DefinitionsList from '@/components/DefinitionsList.vue'
import StrokeOrder from '@/components/StrokeOrder.vue'

export default {
  components: {
    StrokeOrder,
    Decomposition,
    DefinitionsList
  },
  props: {
    character: {
      stype: Object
    },
    pinyin: {
      default: ''
    }
  },
  data() {
    return {
      examples: [],
      charKey: 0
    }
  },
  mounted() {
    this.getExamples()
  },
  methods: {
    async getExamples() {
      this.examples = (await (await this.$dictionary).lookupByCharacter(
        this.character.character
      )).filter(example => example.english && example.english !== 'NULL')
    },
    async getPartExamples(part) {
      part.getting = true
      part.characters = await (await this.$hanzi).searchByRadical(
        part.character
      )
      for (let character of part.characters.slice(0, 1)) {
        character.examples = []
        character.examples = await (await this.$dictionary).lookupByCharacter(
          character.character
        )
        part.getting = false
        this.charKey++
      }
    },
    highlightCharacter(text, character, hsk) {
      if (text) {
        return text.replace(
          character,
          '<span data-level="' + hsk + '">' + character + '</span>'
        )
      }
    }
  }
}
</script>

<style>
.character-examples {
  list-style: none;
  margin: 0;
  padding: 0;
}

.character-example-header-word {
  font-size: 2.5rem;
}

.character-example-header-word a {
  color: inherit;
  text-decoration: none;
}

.character-example a {
  text-decoration: none;
  color: inherit;
}

.character-example [data-level] {
  font-weight: bold;
}

.character-examples.collapsed li:nth-child(n + 5) {
  display: none;
}

.character-example-word {
  font-size: 1.4rem;
}

.character-example-word[data-level] {
  font-weight: bold;
}

.character-example-pinyin {
  color: #969696;
}

.character-example-english {
  font-style: italic;
  color: #a7a7a7;
}

.character-example-word a,
.parts a {
  color: inherit;
  text-decoration: inherit;
}

.part-examples {
  list-style: none;
  padding-left: 1.2rem;
}

.etymology {
  padding: 0.6rem 0;
  margin: 0.5rem 0;
}
</style>
