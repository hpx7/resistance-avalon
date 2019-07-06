import threading
import cachetools

class CollectionCache:

  def __init__(self, collection, key_name, max_size = 1024):
    self._collection = collection
    self._key_name = key_name
    self._cache = cachetools.LRUCache(max_size)

    thread = threading.Thread(target=self.consume_stream)
    thread.daemon = True
    thread.start()

  def consume_stream(self):
    for change in self._collection.watch(full_document = 'updateLookup'):
      doc = change['fullDocument']
      self._cache[doc[self._key_name]] = doc

  def get_doc(self, key):
    if key in self._cache:
      return self._cache[key]
    doc = self._collection.find_one({self._key_name: key})
    if doc:
      self._cache[doc[self._key_name]] = doc
    return doc
