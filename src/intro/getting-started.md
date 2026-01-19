# Getting Started

This chapter will guide you through writing and running your first Fram program.

## Interactive Mode (REPL)

The easiest way to start experimenting with Fram is to use the interactive mode
(REPL). If you have `dbl` installed (see [Installation](installation.md)), you
can start it in the interactive mode by running the command without
any arguments. For better readline support and ease of use we suggest using
`rlwrap`.

```sh
rlwrap dbl
```

You should see a prompt where you can enter Fram phrases terminated by `;;`.
The interpreter will evaluate the phrase and print the result type and value in
the next two lines. Phrases are either simple expressions or definitions and can
 span multiple lines.

```fram
> 1 + 2 ;;
: Int
= 3
> "Hello," + " " + "World!" ;;
: String
= "Hello, World!"
> let x = 40
let y = 2 ;;
> x + y ;;
: Int
= 42
> let b = True in if b then 1 else 2 ;;
: Int
= 1
>
```

## Hello World

To create a standalone program, create a file named `hello.fram` with the
following content.

```fram
let _ = printStrLn "Hello, World!"
```

In Fram, top-level expressions must be bound to a name. The wildcard pattern `_`
is used here to discard the result of `printStrLn` (which is `()`, the unit
value) and execute the side effect.

Run the program using the `dbl` interpreter by passing the path to the file
as an argument.

```sh
dbl hello.fram
```

You should see the output.

```sh
Hello, World!
```


## Basic Syntax

### Comments

Line comments in Fram start with the `#` character and extend to the end of the
line.

```fram
# This is a comment
let x = 42 # This is also a comment
```

Block comments start with `{#` and end with `#}`. They can span multiple lines
or be embedded within code.

```fram
{# This is a
             multiline block comment #}
let _ = printStrLn {# This is an inline block comment #} "It works!"
```

### Definitions

Values are bound to names using the `let` keyword. These bindings are immutable
but can be shadowed.

```fram
let answer = 42
let message = "Hello"
```

### Functions

Functions can be defined using `let` as well. The arguments follow the function
name.

```fram
let add (x : Int) (y : Int) = x + y
```

In the example above, the `+` operator resolves to a method `add` defined on the
type of `x`. As the type of `x` is not specified and the interpreter cannot
infer which method to use, we must annotate it explicitly. The following
examples will demonstrate operators in various contexts, showing both when
annotations are required and when they are not.

This is syntactic sugar for defining a name that holds an anonymous function
(lambda). The same function can be written using the `fn` keyword.

```fram
let add = fn (x : Int) (y : Int) => x + y
```

Functions are applied by writing the function name followed by its arguments
separated by spaces.

```fram
let result = add 10 32
```

In order for the definition to be recursive it must be bound using `let rec`.
For mutual recursion between multiple definitions the `rec ... end` block can
be used.

```fram
let rec factorial (n : Int) =
  if n == 0 then 1 else n * factorial (n - 1)

rec
  let even (x : Int) =
    if x == 0 then True else odd (x - 1)
  let odd x =
    if x == 0 then False else even (x - 1)
end

```

Fram uses lexical scoping, meaning that functions capture their environment
at definition time and as mentioned earlier, variable bindings can be shadowed.

```fram
let x = 10
let addX y = x + y
let x = 20
let result1 = addX 5
# result1 is 15 because addX captured x = 10

let addX (x : Int) = x + 10
let result2 = addX 5
# result2 is also 15 because the parameter x shadows the outer binding
```

Notice that in the first definition of `addX`, since the type of the captured
`x` is known, we do not need to annotate the function parameter. In the second
definition, the argument `x` shadows the previous definition of `x`. As the type
 of the new `x` is locally unknown, we need to annotate it so the interpreter
 can correctly infer which `add` method to use when resolving the `+` operator.

### Local Definitions

Local values can be bound using the `let ... in ...` construct. The name bound
in the `let` part is visible only in the expression following `in`.

```fram
let quadruple (x : Int) =
  let doubleX = x + x in
  doubleX + doubleX
```

Multiple local definitions can be bound one after another omitting the `in`
part, only placing it after the last defitnition.
```fram
let x =
  let y = 21
  let add (x : Int) y = x + y
  in
  add y y
```

### Control Structures

Fram supports conditional expressions using `if ... then ... else ...`.
Since it is an expression it must return a value and both branches must
have the same type.

```fram
let abs (x : Int) =
  if x < 0 then -x else x
```

The else branch can be omitted if the result of the then branch is
of the Unit type.

```fram
let printHello cond =
  if cond then printStrLn "Hello"
```

### Pattern Matching

Pattern matching is a powerful feature in Fram used to check a value against
a pattern. It is most commonly used with [algebraic data types](data-types.md).

```fram
let isEmpty list =
  match list with
  | [] => True
  | _  => False
  end
```

The wildcard pattern `_` matches any value. Pattern matching is exhaustive,
meaning all possible cases must be covered.