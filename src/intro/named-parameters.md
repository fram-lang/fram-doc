# Named Parameters

The mechanism of named parameters is one of the central features of the Fram
programming language. With the support of other language constructs, named
parameters are used to express a variety of advanced programming features,
such as parametric polymorphism, existential types, record types, and ML-like
module system. Here we give a brief overview of named parameters in Fram.

## Parametric Polymorphism and Type Schemes

Fram supports ML-style parametric polymorphism and type reconstruction.
Briefly, the type of a function is automatically inferred by the compiler
and generalized to be as polymorphic as possible. For instance, consider
the following definition of the identity function.

```fram
let id x = x
```

The compiler infers the type of `id` to be `T -> T` for each type `T`.
To represent such polymorphism over type `T`, the type system assigns
*type schemes* to variables. The type scheme of `id` function is
`{type T} -> T -> T`, where the first arrow `{type T} -> ...` binds
the type parameter `T` in the rest of the type `T -> T`. When a variable
with a type scheme is used, all parameters within curly braces of the
type scheme are instantiated. In case of type parameters, the compiler
guesses the actual types to be used for instantiation based on the
context of the usage. For example, the `id` function can be used with
different types as follows.

```fram
let a = id 42    # instantiates T to Int
let b = id "abc" # instantiates T to String
```

The programmer can also explicitly specify type parameters when defining
the function. For example, the equivalent definition of `id` with an explicit
type parameter is as follows.

```fram
let id {type T} (x : T) = x
```

It is also possible to define functions with multiple type parameters.

```fram
let const {type A, type B} (x : A) (_ : B) = x
```

The type scheme of `const` is `{type A, type B} -> A -> B -> A`.

## Named Type Parameters

Type parameters presented in previous section are *anonymous*, i.e., their
names are not visible outside the definition. Indeed, the programmer has no
means to specify the names of type parameters that were implicitly introduced
by ML-style type inference. However, Fram also supports *named type
parameters*, which can be explicitly specified by the programmer. To specify a
named type parameter, the `type` keyword is omitted and only the name of the
parameter is written within curly braces. For example, the definition of `id`
function with a named type parameter is as follows.

```fram
# identity function with a type scheme {T} -> T -> T
let id {T} (x : T) = x
```

When a polymorphic function has a named type parameter, it can be explicitly
instantiated by specifying the name of the type parameter and the actual
type to be used for instantiation. When the explicit instantiation is omitted,
the compiler infers the actual type as usual.

```fram
let intId = id {T=Int}
let strId = id : String -> String # infers T to be String
```

When multiple named type parameters are present, the programmer can specify
the actual types for some of the parameters, and let the compiler infer
the rest. Moreover, the order of the specified parameters can be arbitrary.

```fram
let pair {A, B} (x : A) (y : B) = (x, y)
let p1 = pair {A=Int, B=String} 42 "abc"
let p2 = pair {B=String} 42 "abc" # infers A to be Int
let p3 = pair {B=String, A=Int} 42 "abc"
```

In rare cases, the programmer may want to give a name to a type parameter
that is the same as an existing type in the current scope, and still be able
to refer to both the existing type and the type parameter within the function
body. In order to avoid name clashes, the name visible in the scheme can be
different from the name of the type parameter used within the function body.
For example, assume that the type `T` is already defined in the current scope.
Then, the following definition abstracts over a type parameter named `T`, but
for the purpose of the definition, the type parameter is referred to as `U`,
while `T` still refers to the existing type.

```fram
type T = Int # existing type T

let foo {T=U} (x : T -> U) = x 42

# Almost equivalent definition, but with different name of the type parameter
let bar {U} (x : T -> U) = x 42

let _ = foo {T=Int} id
let _ = bar {T=Int} id # Warning: bar doesn't expect T parameter
```

The same can be done in type schemes. The type scheme of `foo` is
`{T=U} -> (T -> U) -> U`. Note that type variable `U` is bound, so it can
be renamed to e.g., `V` (`{T=V} -> (T -> V) -> V`) without changing the
meaning of the type scheme. Actually, the syntax `{T} -> ...` is just
a syntactic sugar for `{T=T} -> ...`.

## Regular Named Parameters

In Fram, named parameters are not limited to type parameters. Regular
named parameters can also be defined and used in a similar manner.
The names of regular parameters start with a lowercase letter.

```fram
let linear {a : Int, b : Int} x = a * x + b

let intId   = linear {a=1, b=0}
let const b = linear {b, a=0} # shorthand for linear {b=b, a=0}
```

As before, the order of specified named parameters can be arbitrary, however,
when instantiating with effectful parameters, the order of evaluation is
always from left to right. In contrast to type parameters, all regular named
parameters must be explicitly specified when using the function.

## Optional Parameters

Fram also supports optional named parameters. Optional parameters have names
starting with a question mark, but bind a variable with the same name without
this character. This variable has type `Option T`, where `T` is the type of
the parameter.

```fram
# The scheme of greet is {?name : String} -> Unit ->> String
let greet {?name} () =
  match name with
  | Some n => "Hello, " + n + "!"
  | None   => "Hello, world!"
  end
```

Optional parameters can be omitted when the function is used. In this case,
the value `None` is passed to the function. When the parameter is specified,
the value is wrapped in `Some` constructor. Moreover, the programmer can
pass value of type `Option _` directly, when the name used in the
instantiation starts with a question mark.

```fram
let msg1 = greet ()                    # name is None
let msg2 = greet {name="Alice"} ()     # name is Some "Alice"
let msg3 = greet {?name=None}   ()     # name is None
let msg4 = greet {?name=Some "Bob"} () # name is Some "Bob"
```

## Implicit Parameters

Another useful feature of named parameters in Fram is *implicit parameters*.
Implicit parameters come together with a special namespace for variables,
that have names starting with a tilde (`~`). Name of implicit parameters also
start with a tilde, and if not stated otherwise, they bind variables with the
same names. Implicit parameters can be omitted when the function is used. In
such a case, the compiler resolves the value of the parameter by searching for
a variable with the same name in the current scope.

```fram
let doSomething {~log : String ->> Unit} () =
  ~log "Doing something important!";
  let result = 42 in
  ~log "Something important is done.";
  result
```

To call a function which has implicit parameters, the programmer can either
specify the value of the parameter explicitly, or define a variable with the
same name in the current scope.

```fram
let _ = doSomething {~log=printStrLn} ()
let doWithoutLogging () =
  let ~log msg = () in # define a no-op logger
  doSomething ()       # compiler uses the local ~log
```

When a function takes an implicit parameter, it introduces it into the
implicit namespace for the body of the function. Therefore, implicit
parameters can be transitively passed to other functions which also take
implicit parameters.

```fram
let doMore {~log} () =
  ~log "Starting doing more";
  let result = doSomething () in
  ~log "Finished doing more";
  result
```

Same as with other named parameters, the programmer may bind an implicit
parameter to a different name to avoid name clashes. A binder `{~name}` is
just syntactic sugar for `{~name=~name}`.

```fram
let doSomethingElse {~log=logger} () =
  logger "Doing something else"
```

## Sections

When programming with named parameters, especially implicit parameters, often
the same named parameters are passed repeatedly to multiple functions. To
avoid such boilerplate code, Fram supports *sections*, which allow grouping
definitions with common named parameters. A named parameter can be declared
at any point within a section using `parameter` keyword, and will be added
to the type schemes of all following definitions that use this parameter.
In particular, declared implicit parameter behaves similarly to dynamically
bound variables in Lisp-like languages, but in a type-safe manner.

```fram
parameter ~log : String ->> Unit

let doSomething () =
  ~log "Doing something important!";
  let result = 42 in
  ~log "Something important is done.";
  result

let doMore () =
  ~log "Starting doing more";
  let result = doSomething () in
  ~log "Finished doing more";
  result

let doMoreTwice () =
  doMore ();
  doMore ()

let doAllIgnoringLogging () =
  let ~log msg = () in
  doSomething ();
  doMoreTwice ()
```

In the above example, functions `doSomething`, `doMore`, and `doMoreTwice` use
the implicit parameter `~log` directly or indirectly, so their type schemes
include `~log` parameter. On the other hand, `doAllIgnoringLogging` doesn't
have `~log` parameter, because it doesn't use it in its body: it defines a
local `~log` that shadows the implicit parameter. The parameter construct can
also be used to declare other kinds of named parameters. For instance, this
mechanism can be used to name type parameters, but keep the code concise.

```fram
parameter Elem
parameter Acc

let rec foldLeft (f : Acc -> Elem ->> Acc) acc xs =
  match xs with
  | []       => acc
  | y :: ys  => foldLeft f (f acc y) ys
  end
```

The scope of a parameter declaration extends to the end of the current
section. In most cases it is the end of the current file or module. For local
definitions within a function body, the scope of parameter declaration extends
to the `in` keyword that ends the block of local definitions.

```fram
let foo {~log} () =
  parameter ~log : String ->> Unit
  # the following two definitions have ~log parameter
  let bar () = ~log "In bar"
  let baz () = ~log "In baz"; bar ()
  in
  # the following definition does not have ~log parameter;
  # the ~log here refers to the parameter of foo
  let quux () = ~log "In quux" in
  bar ()
```

## Rank-N Types and Higher-Order Functions

At the level of types, named parameters are part of a type scheme rather than
a type. Therefore, named parameters are always instantiated at the time of
usage. This is particularly important for optional parameters, since the
presence or absence of an optional parameter is always clear from the call
site, which avoids possible ambiguities. On the other hand, this design choice
implies that functions with named parameters are not truly first-class values:
they cannot be returned directly from functions. However, Fram allows a form of
Rank-N types for all kinds of named parameters, so it allows functions with
named parameters to be passed as arguments to other functions. For example, the
following function takes a function with named parameters as an argument and
applies it.

```fram
let foo (f : {X, x : X} -> (X -> _) -> _) =
  f {x=42} id
```

The limitation of this mechanism is that arguments with non-trivial type
schemes must be explicitly annotated, as argument `f` in the above example.
This requirement is standard in languages with Rank-N types.

To pass a function with named parameters as an argument, the programmer can
use a lambda expression with named parameters. For example, to call the above
`foo` function with a lambda expression, the following code can be used.

```fram
foo (fn {x} g => g x)
```

The programmer can omit some named parameters in the lambda expression. In
such a case, the omitted parameters will be introduced without giving them
names. For the kinds of named parameters introduced in this section, it means
that the omitted parameters cannot be explicitly referred to within the body
of the lambda expression. However, these parameters may still be accessible
indirectly through the type inference (e.g., variable `x` in the above example
has type `X`, which is an omitted named type parameter) or the method
resolution mechanism (described in later sections).

When the lambda abstraction doesn't bind named parameters at all, implicit
parameters behave differently. In order to mimic the behavior of dynamically
bound variables, implicit parameters are automatically introduced to the
context of the lambda body. For example, consider the following code.

```fram
let logToStdout (f : {~log} -> _) =
  f {~log=printStrLn}

let _ = logToStdout (fn () =>
  ~log "Logging to stdout")
```

In this example, the `~log` parameter is automatically introduced to the body
of the lambda expression, so the programmer can use it directly. This behavior
is specific to implicit parameters; other kinds of named parameters must be
explicitly bound in the lambda abstraction to be used within the body.
