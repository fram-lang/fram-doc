# Notational Conventions

This reference manual will often present the grammars of various elements of
Fram's syntax. We use a variant of the BNF notation to specify the grammars.
Non-terminal symbols have no special formatting, while the terminals are
enclosed in quotation marks. Alternatives are separated by `|`, and grouping is
achieved with parentheses: `(E)`. We also use `{E}` to denote repetition, and
`[E]` to denote the optional inclusion of `E`. See the following grammar for
a simple example (not specifically related to Fram).
```bnf
digit       ::= "0"..."9"
letter      ::= "a"..."z" | "A"..."Z"
lower-ident ::= ( "a"..."z" | "_" ) { letter | digit | "_" | "'" }
integer     ::= "0" | [ "-" ] "1"..."9" { digit }
```
