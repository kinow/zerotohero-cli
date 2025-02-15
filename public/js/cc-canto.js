/**
 * @file Converts pinyin tone numbers to tone marks.
 * @author Kevin K. Yang <yangkevi@usc.edu>
 * @copyright Kevin K. Yang 2017. Licensed under the MIT License.
 */

/**
 * An object holding arrays of Unicode tone marks for each vowel.
 * Each tone mark can be accessed very intuitively. For example,
 * to access the tone marked version of a2, you would call
 * toneMarks["a"][2].
 *
 * @type {Object}
 */
var toneMarks = {
  a: ['a', '\u0101', '\u00e1', '\u01ce', '\u00e0', 'a'],
  e: ['e', '\u0113', '\u00e9', '\u011b', '\u00e8', 'e'],
  i: ['i', '\u012b', '\u00ed', '\u01d0', '\u00ec', 'i'],
  o: ['o', '\u014d', '\u00f3', '\u01d2', '\u00f2', 'o'],
  u: ['u', '\u016b', '\u00fa', '\u01d4', '\u00f9', 'u'],
  v: ['\u00fc', '\u01d6', '\u01d8', '\u01da', '\u01dc', '\u00fc']
}

/**
 * @return {Boolean} whether this string is a single alphabetical letter.
 */
String.prototype.isAlpha = function() {
  return /^[A-Za-z]$/.test(this)
}

/**
 * @return {Boolean} is this string a valid pinyin vowel
 */
String.prototype.isPinyinVowel = function() {
  return /^[aeiouv\u00fc]$/.test(this)
}

/**
 * Finds the last occurrence of a regular expression
 * pattern match in this String.
 *
 * @param  {RegExp} the pattern to match
 * @return {Number} the last match in this string
 */
String.prototype.lastIndexOfRegex = function(regExp) {
  var lastIndex = -1
  for (var i = 0; i < this.length; i++) {
    if (regExp.test(this.charAt(i))) {
      lastIndex = i
    }
  }

  return lastIndex
}

/**
 * @param  {Number} index The index of the character to replace
 * @param  {String} replacement The string to insert at the index
 * @return {String} this String, with the specified replacement
 */
String.prototype.replaceAt = function(index, replacement) {
  if (index >= 0 && index < this.length && typeof replacement === 'string') {
    return this.substring(0, index) + replacement + this.substring(index + 1)
  } else {
    return this
  }
}

/**
 * Converts this String, which must be a single pinyin word followed by a
 * tone number, to the equivalent pinyin word with tone marks.
 *
 * @return {String} this String, with the tone number removed
 *                       and tone mark inserted.
 */
String.prototype.convertPinyin = function() {
  // convert to lowercase
  var str = this.toLocaleLowerCase()
  // get index of the tone number
  var toneNumIndex = str.search(/[1-5]/)
  // get index of the first pinyin vowel
  var firstVowelIndex = str.search(/[aeiouv\u00fc]/)
  if (
    str.length > 7 ||
    toneNumIndex < 1 ||
    toneNumIndex !== str.length - 1 ||
    firstVowelIndex < 0
  ) {
    // this string is either too long to be pinyin, does not contain a \
    // correctly placed tone number, or has no pinyin vowels
    // console.log("String.prototype.convertPinyin:" + this +
    //             " is not a valid pinyin word.")
    return this
  }
  /** @type {Number} from 1 to 5 */
  var toneNum = parseInt(str[toneNumIndex])
  if (/[ae]/.test(str)) {
    // str contains an 'a' or an 'e', both of which take precedence
    var index = str.search(/[ae]/)
    str = str.replaceAt(index, toneMarks[str.charAt(index)][toneNum])
  } else if (/ou/.test(str)) {
    // str contains 'ou'. The tone always goes on the 'o'
    var index = str.search(/ou/)
    str = str.replaceAt(index, toneMarks[str.charAt(index)][toneNum])
  } else {
    // place the tone on the last vowel
    var index = str.lastIndexOfRegex(/[aeiouv\u00fc]/)
    var vowel = str.charAt(index)
    if (vowel == '\u00fc') {
      vowel = 'v'
    }
    str = str.replaceAt(index, toneMarks[vowel][toneNum])
  }
  // strip the tone number
  str = str.substring(0, str.length - 1)
  return str
}

/**
 * @param  {String} the string to convert
 * @return {String} the converted string
 */
var pinyinify = function(str) {
  if (typeof str !== 'string') {
    return str
  }

  var res = ''
  var i = 0
  // parse str character by character
  while (str.length > 0) {
    var char = str.charAt(i)
    if (char.isAlpha()) {
      // a letter has been found
      if (i !== 0) {
        // remove non-letters found up to now, add to res
        res += str.substring(0, i)
        str = str.substring(i)
        i = 0
      }
      // get index of next tone number, if it exists
      var toneNumIndex = str.search(/[1-5]/)
      // get index of next whitespace, if it exists
      var whitespaceIndex = str.search(/\s/)

      if (
        toneNumIndex > 0 &&
        toneNumIndex < 7 &&
        (whitespaceIndex < 0 || whitespaceIndex > toneNumIndex)
      ) {
        // there is a tone number within 6 characters from now, and no \
        // whitespaces between this character and the tone number
        res += str.substring(0, toneNumIndex + 1).convertPinyin()
        str = str.substring(toneNumIndex + 1)
      } else if (whitespaceIndex < 0) {
        // no valid tone numbers nor whitespace, add rest of string to res
        res += str.substring(0)
        str = ''
      } else {
        // whitespace found, remove everything up to and including the \
        // whitespace, and add to res
        res += str.substring(0, whitespaceIndex + 1)
        str = str.substring(whitespaceIndex + 1)
      }
    } else if (i >= str.length) {
      // no more characters to parse
      res += str.substring(0)
      str = ''
    } else {
      // increment index
      i++
    }
  }

  return res
}

const Dictionary = {
  file: '../data/cc-canto/cccanto-webdist.tsv.txt',
  words: [],
  name: 'cc-canto',
  load() {
    return new Promise(resolve => {
      Papa.parse(this.file, {
        download: true,
        header: true,
        complete: results => {
          let sorted = results.data.sort((a, b) =>
            a.traditional && b.traditional ? a.traditional.length - b.traditional.length : 0
          )
          let data = []
          for(let [index, row] of sorted.entries()) {
            let word = Object.assign(row, {
              id: index.toString(),
              head: row.traditional,
              bare: row.traditional,
              pinyin: row.pinyin ? this.parsePinyin(row.pinyin) : '',
              accented: row.traditional,
              definitions: [row.english],
              cjk: {
                canonical: row.traditional && row.traditional !== 'NULL' ? row.traditional : undefined,
                phonetics: row.jyutping 
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
  parsePinyin(pinyin) {
    return pinyinify(pinyin.replace(/u:/gi, 'ü')) // use the pinyinify library to parse tones
      .replace(/\d/g, '') // pinyinify does not handle 'r5', we remove all digits
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
  matchChinese(text) {
    if(!text) return false
    return text.match(
      // eslint-disable-next-line no-irregular-whitespace
      /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B‌​\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFA6D\uFA70-\uFAD9]+/g
    )
  },
  isRoman(text) {
    return text.match(/\w+/) ? true : false
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
    return this.words.filter(row => row.traditional && row.traditional.includes(char))
  },
  lookupKana(kana) {
    const candidates = this.words.filter(row => {
      return row.jyutping === kana
    })
    return candidates
  },
  lookupByPattern(pattern) {
    // pattern like '～体'
    var results = []
    if (pattern.includes('～')) {
      const regexPattern = '^' + pattern.replace(/～/gi, '.+') + '$'
      const regex = new RegExp(regexPattern)
      results = this.words.filter(word => regex.test(word.jyutping))
    } else {
      results = this.words.filter(word => word.jyutping.includes(pattern))
    }
    return results
  },
  lookupFuzzy(text, limit = 30) {
    text = text.trim()
    if (!this.isRoman(text)) {
      let results = []
      if (this.isChinese(text)) {
        let words = this.words.filter(row => row.traditional && (row.traditional === text || row.simplified === text))
        let moreWords = this.words.filter(row => row.traditional && row.traditional !== text && (row.traditional.includes(text) || row.simplified.includes(text)))
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
  isTraditional(text) {
    let matchedSimplified = []
    let matchedTraditional = []
    for (let row of this.words) {
      if (text.includes(row.simplified)) matchedSimplified.push(row.simplified)
      if (text.includes(row.traditional))
        matchedTraditional.push(row.traditional)
    }
    const trad = this.unique(matchedTraditional).length
    const simp = this.unique(matchedSimplified).length
    return trad > simp
  },
  subdictFromText(text) {
    return this.subdict(
      this.words.filter(function(row) {
        return text.includes(row.simplified) || text.includes(row.traditional)
      })
    )
  },
  /* Returns the longest word in the dictionary that is inside `text` */
  longest(text, traditional = false) {
    // Only return the *first* seen word and those the same as it
    let first = false
    const tradOrSimp = traditional ? 'traditional' : 'simplified'
    let matches = this.words
      .filter(row => this.isChinese(row.simplified))
      .filter(function(row) {
        if (first) {
          return row[tradOrSimp] === first
        } else {
          if (text.includes(row[tradOrSimp])) {
            first = row[tradOrSimp]
            return true
          }
        }
      })
      .sort((a, b) => {
        return b.weight - a.weight
      })
    return {
      matches: matches,
      text: matches && matches.length > 0 ? matches[0][tradOrSimp] : ''
    }
  },
  tokenize(text) {
    return this.tokenizeRecursively(
      text,
      this.subdictFromText(text),
      this.isTraditional(text)
    )
  },
  tokenizeRecursively(text, subdict, traditional = false) {
    const isChinese = subdict.isChinese(text)
    if (!isChinese) {
      return [text]
    }
    const longest = subdict.longest(text, traditional)
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
            subdict,
            traditional
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
  }
}
