class UpdatesSearchIndex {
  data() {
    return {
      permalink: "updates/search.json"
    };
  }

  render({ updates }) {
    return JSON.stringify(
      updates.map((post) => ({
        title: post.title,
        url: post.url,
        date: post.date,
        excerpt: post.excerpt,
        mediaKind: post.mediaKind,
        tags: post.tags,
        content: post.searchText
      }))
    );
  }
}

module.exports = UpdatesSearchIndex;

