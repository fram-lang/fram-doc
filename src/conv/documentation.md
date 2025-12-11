# Code Documentation

The standard library documentation is written in a "code-first" style. This
means all necessary comments and descriptions are embedded directly in the
code, and a specialized tool generates the appropriate documentation pages
from the code.

## Documentation format

Documentation comments—also referred to as docstrings—can be either single-line
or multi-line. They always begin with a double `##` symbol and must start in
the first column of an empty line.

The body of the docstring supports Markdown formatting. Markdown headers are
usually written using single-line comments. The body of a block docstring is
either written inline or starts on the next line, indented with 2 spaces. The
closing marker of a multiline comment can appear either on a separate line or
immediately after the final line of the docstring body.

During the process of generating doc pages, all docstring are concatenated 
to a single, continuous markdown file. Even though it is possible, we advise
against splitting markdown constructs like tables across multiple docstrings.

For example:

```
## # Main header

{##
  This is an example docstring with a markdown table:

  | Column 1 | Column 2 |
  | -------- | -------- |
  | 10       | abc      |
  | 20       | def      |

  End of docstring.
 ##}

{##
  Another docstring with inlined closing sign. ##}

{## This is valid too. ##}
```

### Definition documentation

When a docstring is immediately followed by a code definition, it is attached
to that definition. The first continuous block of text is treated as a brief
description. After an empty line, a more detailed explanation may be added.

Additionally, `@param`, `@asserts`, and `@return` labels are supported in
functions' and methods' docstrings. These must be placed after the brief
description.

The `@param` label is followed by a parameter name and may include an optional
description. Optional and implicit parameters must be prefixed with `~` or `?`,
just as in code. Unnamed parameters cannot be documented.

The `@asserts` label indicates that the function may raise a runtime error and
terminate program execution. You may add a description explaining under what
conditions this occurs.

The `@returns` label describes the result produced by the function.

### Scopes

Sometimes, the natural flow of documentation is disrupted—such as when type
definitions, methods, or helper functions are declared elsewhere for structural
or organizational reasons. In such cases, attaching a docstring directly above
the definition isn't possible or desirable. To address this, documentation can
be written separately and explicitly linked to the intended code element using
an identifier.

In such cases, docstrings are mandatorily multiline and apropriate identifiers
are written in the same line as the comments' opening markers.

Supported identifiers include:
- `@data Name` - ADTs and records
- `@type Name`- Builtin types and type synonyms
- `@parameter Name`
- `@method Type Name`
- `@val Name` - refers to any let statement
- `@handler Name`
- `@module Module`

### ADTs and Records

While documenting all data constructors and named parameters from a single
docstring is sufficient, it is not always desirable. To make the documentation
more readable, each data constructor and each named parameter may be annotated
separately. Every docstring must be indented to match the parameter or
constructor it refers to. For example:
```
## Structure for demonstration purposes
data MyAwesomeType =
  ## Empty constructor
  | CtorA
  
  ## Constructor with parameter
  | CtorB of
    ## First parameter
    { param1: Int
    
    ## Second parameter
    , param2: String
    }

```

## Guidelines

To ensure good and consistent quality, follow these guidelines:

- Less is more - avoid long descriptions.
- Sentences should be written in Present Simple tense,
  although sometimes it is necessary to deviate from that.
- End every sentence with a period.
- Avoid using the function name as a noun and a verb in the same sentence.
  Specifically, don't write descriptions like "`map` maps ..." and 
  "`append` appends ...".
- When optional parameters are involved, describe default behavoiur
  explicitely.
- Document edge cases of a function.
- Do not document types of a function and arguments, unless necessary. All type
  annotations will be added by a documentation tool.
- Doc lines, just as code, can not exceed width of 80 characters.

When in doubt, feel free to lookup examples of other languages' documentation.

*Remeber, do not plagiariase!*

## Examples

### Int64 

`Int64` is a builtin type, which means that the there is no declaration
of this type in Prelude. Fortunately, scoping allows us to add docstring
regardless.

```fram
## ## Int64

{## @type Int64

  A builtin type, representing native, signed 64bit integers.
 ##}

{##
  64bit integer division.

  @asserts Divisor cannot be equal to 0.
 ##}
pub method div (self : Int64) = ....
```

### foldRighti1

Imagine a `foldRight` variant that takes last element as an accumulator.
If applied to empty list, it calls implicit function `~onError`. 
It also allows overriding the starting value of the iterator index `i`.

Even though the type is quite elaborate, documentation is straightforward.

```fram
{##
  Folds the list into a single value, using the last element of list as the
  initial accumulator and passing index of each processed element.
  
  Allows overriding the initial value of the iterator. When applied
  to an empty list, calls implicit `~onError` function.

  @param ?i Initial value of the iterator index. Defaults to 0.
  @param ~onError Fallback function for an empty list.
  @param f Folding function. Receives an additional index argument.
  @param xs List to be folded.

  @returns The result of the iteratively applied folding operation.
 ##}
pub let foldRighti1 
  {type A, ?i : Int, ~onError} 
  (f : (Int -> A -> A -> A)) 
  (xs : List A) = ...
```
