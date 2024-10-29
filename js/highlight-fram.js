hljs.registerLanguage("fram", function (hljs) {
  return {
    keywords: {
      keyword:
        "abstr as data effect effrow else end extern finally fn handle handler " +
        "if implicit import in label let match method module of open pub " +
        "rec return then type with _",
      literal: "True False",
    },
    contains: [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.COMMENT("\\(\\*", "\\*\\)"),
      {
        className: "type",
        begin: "\\b[A-Z]\\w*",
      },
      {
        className: "number",
        begin: "\\b(0[bB][01]*|0[oO][0-7]*|[0-9]+|0[xX][0-9a-fA-F]*)L?",
      },
    ],
  };
});

// Additional scripts are loaded after the `book.js` file, which is responsible for hihghlighting code blocks.
// That means that the `fram` language is not yet registered when the code blocks are highlighted.
// Triggering highlighting here again fixes the issue, but it still leaves warning in the console though.
// See https://github.com/rust-lang/mdBook/issues/657#issuecomment-924556465
hljs.initHighlightingOnLoad();
