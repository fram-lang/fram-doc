# Lexical Structure

## Whitespace

The following characters are considered as whitespace (blanks): horizontal tab
(`0x09`), new line (`0x10`), vertical tab (`0x11`), form feed (`0x12`),
carriage return (`0x13`), and space (`0x20`). Whitespace characters are ignored
by the lexer, but they separate tokens, e.g., identifiers or literals.

## Comments

Fram supports two kinds of comments: single-line and block comments. Comments
are treated similarly to whitespace: they are ignored by the lexer, but they
always separate tokens.

Single-line comments start with the `#` character and end with a new line or
the end of file.

Block comments are introduced by the sequence `{#` followed by any, possibly
empty, sequence *name* of any characters except control characters
(`0x00-0x1f`, `0x7f`), space, and curly braces (`{` and `}`). Such a block
comment is terminated by the first occurrence of *name* that is immediately
followed by `#}`. More precisely, it can be described by the following grammar.
```bnf
block-comment-name  ::= { "!"..."z" | "|" | "~" | non-ascii-character }
block-comment-start ::= "{#" block-comment-name
block-comment-end   ::= block-comment-name "#}"
```
At the comment opening, the longest consecutive sequence described by
`block-comment-name` is taken as the comment name. This name should be a suffix
of the name provided at comment closing. Comments using the same name cannot
be nested. This is not an issue in practice, since the programmer can always
choose a unique name to accomplish nesting.

By convention, single-line comments starting with `##` and block comments
with a name starting with `#` are used as documentation comments, and can be
recognized by some external tools.

### Examples

The following code contains some valid comments.
````fram
# This is a single-line comment.
{# This is a block comment. #}
{# Block comments
  may span multiple lines.
#}
let id x = x # A single-line comment may appear at the end of a line.

let n {# A block comment may span a part of a single line. #} = 42
{#aaa
Comments cannot be nested,
{# but the programmer may choose the comment delimiters. #}
aaa#}

{#!a! Comment names may contain operators. !a!#}

{#abc
This comment is ended by `abc` immediately followed by `#}`,
even if the closing sequence is preceded by other characters.
zzabc#}

let {#
# This is not a single-line comment,
# because comments are not nested.
# This comment can be ended #} here = 13

## This is a documentation comment.
let foo x = x

{## This is another documentation comment. ##}
let bar = foo

{###
Documentation comments can contain some code
```
{## with another documentation comment (with a different name). ##}
let some_code = 42
```
###}
let baz = bar
````

## Literals

```bnf
digit        ::= "0"..."9"
lower-char   ::= "a"..."z" | "_"
upper-char   ::= "A"..."Z"
ident-char   ::= lower-char | upper-char | digit | "'"
```

## Keywords

## Identifiers

## Operators

```bnf
op-char ::= "<" | ">" | "&" | "$" | "?" | "!" | "@" | "^" | "+" | "-"
          | "~" | "*" | "%" | ";" | "," | "=" | "|" | ":" | "." | "/"
```
