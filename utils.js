module.exports = {
  randomId: () => Math.random().toString(36).substring(2),
  callback: (fn) => (err, result) => {
    if (err) {
      console.error(err)
      fn({success: false})
    } else if (result.modifiedCount === 0) {
      fn({success: false})
    } else {
      fn({success: true})
    }
  },
  shuffle: (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
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
