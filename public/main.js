var search = instantsearch({
  // Replace with your own values
  appId: '8AOQAW9EZA',
  apiKey: '8caaee2531c0957918fc460b01e2acbb', // search only API key, no ADMIN key
  indexName: 'sf-events',
  urlSync: true,
  searchParameters: {
    page: 0,
    hitsPerPage: 100,
    disjunctiveFacetsRefinements: {
      // 'group.category.sort_name': ['Tech', 'Career & Business'],
      // is_popular: [true, 'true'],
      // is_full: [false, 'false']
      "is_popular": ["true"],
      "is_full": ["false"]
    },
    // tagRefinements: ['group.category.sort_name:Tech']
      // is_popular:[true]
    // },
    // toggleRefinements: {
      // 'group.category.sort_name': ['Tech']
      // is_popular:[true]
    // },
    // facets: ['is_popular']
    // facets: ['group.category.sort_name']
    // facetFilters: ['is_popular:true']
    // facetFilters: ['is_popular:true']
    // facetFilters: {
    //   'group.category.sort_name': 'Tech',
    //   'is_getting_full': true,
    //   'is_full': false
    // }
  }
})

search.templatesConfig.helpers.makeTitle = function (text, render) {
  return '<h1>' + render(text) + '</h1>'
}

search.templatesConfig.helpers.ternary = function (text, render) {
  var val = render(text)
  var condition = val.split('?')[0]
  var labels = val.split('?')[1]
  if (eval(render(condition))) {
    return render(labels.split(':')[0])
  }
  return render(labels.split(':')[1])
}

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-input',
    magnifier: false,
    reset: false
  })
)

var today_local_date = moment().format('YYYY-MM-DD')
var prev = ''
var apply_bg_color1 = false

// Add this after the other search.addWidget() calls
search.addWidget(
  instantsearch.widgets.infiniteHits({
    container: '#pagination',
    templates: {
      empty: 'No results',
      item: document.getElementById('hit-template').innerHTML,
    },
    transformData: {
      item: function(hit) {
        const hourOfDay = parseInt(hit.local_time.split(':')[0])
        if (hourOfDay < 17) {
          hit.time_of_day = '☀️'
        } else if (hourOfDay < 20) {
          hit.time_of_day = '🌗'
        } else {
          hit.time_of_day = '🌚'
        }

        if (hit.local_date !== prev) {
          apply_bg_color1 = !apply_bg_color1
          hit.is_first_event_of_day = true
        }
        hit.bg_color1 = apply_bg_color1
        prev = hit.local_date
        var m_date = moment(hit.local_date)
        hit.local_date_string = m_date.format('dd D MMM')
        var diffDays = m_date.diff(moment(today_local_date), 'days')
        if (diffDays == 0) {
          hit.day_from_now = 'Today'
        } else if (diffDays == 1) {
          hit.day_from_now = 'Tomorrow'
        } else {
          hit.day_from_now = 'In ' + diffDays + ' Days'
        }

        if (hit.fee) {
          if (hit.fee.currency === 'USD') {
            hit.fee.currency = '$'
          } else if (hit.fee.currency === 'GBP') {
            hit.fee.currency = '£'
          }
          if (hit.fee.amount) {
            hit.is_paid = false
          }
        }

        return hit
      }
    },
    hitsPerPage: 1000
  })
)

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#refinement-list',
    attributeName: 'group.category.sort_name'
  })
)

search.addWidget(
  instantsearch.widgets.toggle({
    container: '#refinement-list2',
    attributeName: 'is_getting_full',
    label: `🔴Almost Full`,
    values: {
      on: true,
    },
    templates: {}
  })
)

search.addWidget(
  instantsearch.widgets.toggle({
    container: '#refinement-list3',
    attributeName: 'is_full',
    label: 'Is Not Full',
    values: {
      on: false
    },
    templates: {}
  })
)

search.addWidget(
  instantsearch.widgets.toggle({
    container: '#refinement-list4',
    attributeName: 'is_popular',
    label: 'Is Popular',
    values: {
      on: true
    },
    templates: {}
  })
)

search.addWidget(
  instantsearch.widgets.toggle({
    container: '#refinement-list5',
    attributeName: 'has_food',
    label: '🍜 Free Food',
    values: {
      on: true
    },
    templates: {}
  })
)

search.addWidget(
  instantsearch.widgets.toggle({
    container: '#refinement-list6',
    attributeName: 'has_pizza',
    label: '🍕 Free Pizza',
    values: {
      on: true
    },
    templates: {}
  })
)

search.addWidget(
  instantsearch.widgets.toggle({
    container: '#refinement-list7',
    attributeName: 'has_drinks',
    label: '🍸 Free Drinks',
    values: {
      on: true
    },
    templates: {}
  })
)

search.addWidget(
  instantsearch.widgets.clearAll({
    container: '#clearAll',
  })
)
// Add this after all the search.addWidget() calls
search.start()
document.querySelectorAll('.refinement-list').forEach(function(el) {
  el.style.maxHeight = '600px'})

