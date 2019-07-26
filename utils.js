module.exports = {
  randomId: () => Math.random().toString(36).substring(2),
  callback: (fn) => (err, result) => {
    if (err) {
      console.error(err)
      fn({error: 'Unexpected database error occurred'})
    } else if (result.modifiedCount === 0 || result.insertedCount === 0) {
      fn({error: 'Invalid operation'})
    } else {
      fn({error: null})
    }
  },
  find: (items, fn) => {
    return items.find(fn) || {}
  },
  shuffle: (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  },
  rotate: (items, n) =>
    items.slice(n, items.length).concat(items.slice(0, n)),
  flatMap: (items, mapFn) => {
    const result = {}
    items.forEach(item => {
      Object.entries(mapFn(item)).forEach(([key, val]) => {
        result[key] = val
      })
    })
    return result
  },
  sortBy: (items, key) =>
    [...items].sort((a, b) => a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0)
}
