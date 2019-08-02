exports.create = (model) => {
  const channels = new Map()
  const subscribers = new Map()
  model.onUpdate((channel, value) => {
    if (channels.has(channel)) {
      [...channels.get(channel).values()].forEach(callback => callback(value))
    }
  })
  const removeFromChannel = (subscriberId, channel) => {
   if (channels.get(channel).size === 1) {
      channels.delete(channel)
    } else {
      channels.get(channel).delete(subscriberId)
    }
  }
  return {
    subscribe: (subscriberId, channel, callback) => {
      if (!channels.has(channel)) {
        channels.set(channel, new Map())
      }
      channels.get(channel).set(subscriberId, callback)
      if (!subscribers.has(subscriberId)) {
        subscribers.set(subscriberId, new Set())
      }
      subscribers.get(subscriberId).add(channel)
      return model.fetchState(channel)
    },
    unsubscribe: (subscriberId, channel) => {
      if (channels.has(channel) && subscribers.has(subscriberId)) {
        removeFromChannel(subscriberId, channel)
        if (subscribers.get(subscriberId).size === 1) {
          subscribers.delete(subscriberId)
        } else {
          subscribers.get(subscriberId).delete(channel)
        }
      }
    },
    unsubscribeAll: (subscriberId) => {
      if (subscribers.has(subscriberId)) {
        subscribers.get(subscriberId).forEach(channel => removeFromChannel(subscriberId, channel))
        subscribers.delete(subscriberId)
      }
    }
  }
}
