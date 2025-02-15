import Helper from '@/lib/helper'
import Config from '@/lib/config'
import countries from './countries.js'

export default {
  hskColors: {
    1: '#f8b51e',
    2: '#267f94',
    3: '#fd4f1c',
    4: '#bb1718',
    5: '#1b3e76',
    6: '#6a3669',
    outside: '#c59f94'
  },
  hskWordCount: {
    1: 150,
    2: 150,
    3: 300,
    4: 600,
    5: 1300,
    6: 2500
  },
  loaderMessages: [],
  lastId: 0,
  level(level, l2 = undefined) {
    let levels = l2 && l2.code === 'zh' ? {
      1: 'HSK 1',
      2: 'HSK 2',
      3: 'HSK 3',
      4: 'HSK 4',
      5: 'HSK 5',
      6: 'HSK 6',
      7: 'C2',
      all: 'Any',
    } : {
      1: 'Pre-A1',
      2: 'A1',
      3: 'A2',
      4: 'B1',
      5: 'B2',
      6: 'C1',
      7: 'C2',
      all: 'Any'
    }
    return levels[level]
  },
  unescape(html) {
    return $('<div/>')
      .html(html)
      .text()
  },
  uniqueId() {
    this.lastId += 1
    return this.lastId
  },
  uniqueByValue(array, key) {
    let flags = []
    let unique = []
    let l = array.length
    for(let i = 0; i<l; i++) {
      if( flags[array[i][key]]) continue
      flags[array[i][key]] = true
      unique.push(array[i])
    }
    return unique
  },
  // json or plain text only, and returns object
  proxy(url, callback) {
    $.ajax(Config.proxy + '?' + url).done(function(response) {
      callback(response.data)
    })
  },
  // html only, and returns html
  async scrape(url, callback) {
    await $.ajax(Config.scrape + '?' + url).done(function(response) {
      // We use 'ownerDocument' so we don't load the images and scripts!
      // https://stackoverflow.com/questions/15113910/jquery-parse-html-without-loading-images
      var ownerDocument = document.implementation.createHTMLDocument('virtual')
      var $html = $(response, ownerDocument)
      var text = $html.find('a').text()
      return response ? callback($html, response, text) : null
    })
  },
  async scrape2(url, cacheLife = -1, encoding = false) {
    return new Promise((resolve, reject) => {
      $.ajax(
        `${Config.scrape2}?url=${encodeURIComponent(
          url
        )}&cache_life=${cacheLife}` + (encoding ? `&encoding=${encoding}` : '')
      ).done(response => {
        if (response) {
          var ownerDocument = document.implementation.createHTMLDocument(
            'virtual'
          )
          var $html = $(response, ownerDocument)
          resolve($html, ownerDocument, response)
        } else {
          resolve(false)
        }
      })
    })
  },
  highlight(text, word, level = false) {
    let levelAttr = level ? ` data-level="${level}"` : ''
    if (text && word && word.trim() !== '') {
      return text
        .replace(new RegExp(`^(${word})`, 'gi'), ' $1')
        .replace(new RegExp(`(${word})$`, 'gi'), '$1 ')
        .replace(
          new RegExp(`(["'“‘ ])(${word})(["'”’.!?:, ])`, 'gi'),
          `$1<span ${levelAttr} class="highlight">$2</span>$3`
        )
    } else {
      return text
    }
  },
  highlightMultiple(text, words, level) {
    if (text && words && words.length > 0) {
      for (let word of words) {
        text = this.highlight(text, word, level)
      }
      return text
    } else {
      return text
    }
  },
  /* http://hackingui.com/front-end/a-pure-css-solution-for-multiline-text-truncation/ */
  ellipsizeTextBox(el) {
    var wordArray = el.innerHTML.split(' ')
    while (el.scrollHeight > el.offsetHeight) {
      wordArray.pop()
      el.innerHTML = wordArray.join(' ') + '...'
    }
  },
  unique(names) {
    var uniqueNames = []
    $.each(names, function(i, el) {
      if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el)
    })
    return uniqueNames
  },
  country(code) {
    for (let country of countries) {
      if (country.code === code) {
        return country
      }
    }
  },
  randomArrayItem(array, start = 0, length = false) {
    length = length || array.length
    array = array.slice(start, length)
    let index = Math.floor(Math.random() * array.length)
    return array[index]
  },
  loaderMessage(message) {
    this.loaderMessages.push(message)
    console.log('loaderMessage()', message)
    if (this.loaderMessages.length > 4) {
      $('.loading-messages').html(
        '<b>10 more beats...</b><br>It gets faster next time.'
      )
    } else {
      $('.loading-messages').html(`${message}`)
    }
  },
  ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  },
  absoluteURL(base, relative) {
    if(relative.startsWith('http') || relative.startsWith('//')) {
      return relative
    }
    if (relative.startsWith('#')) {
      return base + relative
    }
    if (relative.startsWith('/')) {
      const protocal = base.replace(/(.*):\/\/.*/, '$1')
      const host = base.replace(/.*\/\/([^/]*).*/, '$1')
      return `${protocal}://${host}${relative}`
    }
    var stack = base.split('/'),
      parts = relative.split('/')
    stack.pop() // remove current file name (or empty string)
    // (omit if "base" is the current folder without trailing slash)
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] == '.') continue
      if (parts[i] == '..') stack.pop()
      else stack.push(parts[i])
    }
    return stack.join('/')
  },
  isEmpty(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) return false
    }
    return true
  }
}
