The Fram Language
=================

This repository contains the source files for the Fram language documentation,
which is currently hosted at [fram-lang.org](https://fram-lang.org/).

Contributing
------------

The documentation is written in markdown and built using
[mdBook](https://rust-lang.github.io/mdBook/).
The [mdBook-KaTeX](https://github.com/lzanini/mdbook-katex) preprocessor is
required to render math, but local builds should fail gracefully when it's not
present.

In order to build the site locally, run `mdbook build` in the root of the
project's directory. You can also launch a local HTTP server and rebuild
automatically on changes using the following command.
```
mdbook serve
```

Deployment
----------

The website is hosted using GitHub Pages. Deployment is performed automatically
from the `master` branch of this repository; for details see [the workflow
file](.github/workflows/deploy.yml).
