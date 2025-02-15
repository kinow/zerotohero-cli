const Dictionary = {
  file: '../data/edict/edict.tsv.txt',
  words: [],
  name: 'edict',
  load() {
    return new Promise(resolve => {
      Papa.parse(this.file, {
        download: true,
        header: true,
        complete: results => {
          let sorted = results.data.sort((a, b) =>
            a.kana && b.kana ? a.kana.length - b.kana.length : 0
          )
          let data = []
          for(let row of sorted) {
            let word = Object.assign(row, {
              head: row.kanji || row.kana,
              bare: row.kanji || row.kana,
              accented: row.kanji || row.kana,
              definitions: [row.english],
              cjk: {
                canonical: row.kanji && row.kanji !== 'NULL' ? row.kanji : undefined,
                phonetics: row.kana 
              }
            })
            data.push(word)
          }
          this.words = data.sort((a,b) => b.head && a.head ? b.head.length - a.head.length : 0)
          resolve(this)
        }
      })
    })
  },
  wordForms(word) {
    let forms = [{
      table: 'head',
      field: 'head',
      form: word.bare
    }]
    return forms
  },
  stylize(name) {
    return name
  },
  accent(text) {
    return text
  },
  lookupByDef(text, limit = 30) {
    let results = this.words.filter(row => row.english && row.english.includes(text)).slice(0, limit)
    return results
  },
  unique(array) {
    var uniqueArray = []
    for (let i in array) {
      if (!uniqueArray.includes(array[i])) uniqueArray.push(array[i])
    }
    return uniqueArray
  },
  get(id) {
    let entry = this.words.find(row => row.id === id)
    return entry
  },
  isChinese(text) {
    if (this.matchChinese(text)) return true
  },
  isRoman(text) {
    return text.match(/\w+/) ? true : false
  },
  matchChinese(text) {
    return text.match(
      // eslint-disable-next-line no-irregular-whitespace
      /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B‌​\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFA6D\uFA70-\uFAD9]+/g
    )
  },
  randomArrayItem(array, start = 0, length = false) {
    length = length || array.length
    array = array.slice(start, length)
    let index = Math.floor(Math.random() * array.length)
    return array[index]
  },
  random() {
    return this.randomArrayItem(this.words)
  },
  lookupByCharacter(char) {
    return this.words.filter(row => row.kanji && row.kanji.includes(char))
  },
  lookupKana(kana) {
    const candidates = this.words.filter(row => {
      return row.kana === kana
    })
    return candidates
  },
  lookupByPattern(pattern) {
    // pattern like '～体'
    var results = []
    if (pattern.includes('～')) {
      const regexPattern = '^' + pattern.replace(/～/gi, '.+') + '$'
      const regex = new RegExp(regexPattern)
      results = this.words.filter(word => regex.test(word.kana))
    } else {
      results = this.words.filter(word => word.kana.includes(pattern))
    }
    return results
  },
  lookupFuzzy(text, limit = 30) {
    text = text.trim()
    if (!this.isRoman(text)) {
      let results = []
      if (this.isChinese(text)) {
        let words = this.words.filter(row => row.kanji && row.kanji === text)
        let moreWords = this.words.filter(row => row.kanji && row.kanji !== text && row.kanji.includes(text))
        results = results.concat(words).concat(moreWords)
      } else {
        let words = this.words
          .filter(word => word.bare && word.bare.startsWith(text))
        if (words.length === 0) {
          words = this.words
            .filter(word => text.includes(word.bare))
            .sort((a, b) => b.bare.length - a.bare.length)
        }
        results = words
      }
      if (results) {
        if (limit) {
          results = results.slice(0, limit)
        }
        return results
      }
    }
  },
  subdict(data) {
    let newDict = Object.assign({}, this)
    return Object.assign(newDict, { words: data })
  },
  subdictFromText(text) {
    return this.subdict(
      this.words.filter(function(row) {
        return text.includes(row.head)
      })
    )
  },
  /* Returns the longest word in the dictionary that is inside `text` */
  longest(text) {
    // Only return the *first* seen word and those the same as it
    let first = false
    let matches = this.words
      .filter(function(word) {
        if (first) {
          return word.head === first
        } else {
          if (text.includes(word.head)) {
            first = word.head
            return true
          }
        }
      })
      .sort((a, b) => {
        return b.head.length - a.head.length
      })
    return {
      matches: matches,
      text: matches && matches.length > 0 ? matches[0].head : ''
    }
  },
  tokenize(text) {
    return this.tokenizeRecursively(
      text,
      this.subdictFromText(text)
    )
  },
  tokenizeRecursively(text, subdict) {
    const longest = subdict.longest(text)
    if (longest.matches.length > 0) {
      let result = [] 
      /* 
      result = [
        '我', 
        {
          text: '是'
          candidates: [{...}, {...}, {...}
        ],
        '中国人。'
      ]
      */
      for (let textFragment of text.split(longest.text)) {
        result.push(textFragment) // '我'
        result.push({
          text: longest.text,
          candidates: longest.matches
        })
      }
      result = result.filter(item => item !== '')
      result.pop() // last item is always useless, remove it
      var tokens = []
      for (let item of result) {
        if (typeof item === 'string') {
          for (let token of this.tokenizeRecursively(
            item,
            subdict
          )) {
            tokens.push(token)
          }
        } else {
          tokens.push(item)
        }
      }
      return tokens
    } else {
      return [text]
    }
  },
}
