# Named Parameters

The mechanism of named parameters is one of the central features of the Fram
programming language. With the support of other language constructs, named
parameters are used to express a variety of advanced programming features,
such parametric polymorphism, existential types, record types, and ML-like
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
names are not visible outside the definition. Indeed, the programmer have no
means to specify the names of type parameters implicitly introduced by ML-style
type inference. However, Fram also supports *named type parameters*, which
can be explicitly specified by the programmer. To specify a named type
parameter, the `type` keyword is omitted and only the name of the parameter is
written within curly braces. For example, the definition of `id` function with
a named type parameter is as follows.

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
that is the same as an existing type in the current scope. In order to avoid
name clashes, the name visible in the scheme might be different from the name
of the type parameter used within the function body. For example, assume that
the type `T` is already defined in the current scope. Then, the following
definition abstracts over a type parameter named `T`, but for the purpose
of the definition, the type parameter is referred to as `U`.

```fram
type T = Int # existing type T

let foo {T=U} (x : T -> U) = x 42
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

## Sections

## Rank-N Types and Higher-Order Functions

At the level of types, named parameters are part of a type scheme rather than
a type. Therefore, named parameters are always instantiated at the time of
usage. This is particularly important for optional parameters, since the
presence or absence of an optional parameter is always clear from the call
site, which avoids possible ambiguities. On the other hand, this design choice
implies that functions with named parameters are not truly first-class values:
they cannot be returned directly from functions. However, Fram allows a form of
Rank-N types for all kinds of named parameters, so it allows functions with
named parameters passed as arguments to other functions. For example, the
following function takes a function with named parameters as an argument and
applies it.

```fram
let bar (f : {X, x : X} -> (X -> _) -> _) =
  f {x=42} id
```

The limitation of this mechanism is that arguments with non-trivial type
schemes must be explicitly annotated, as argument `f` in the above example.
This requirement is standard in languages with Rank-N types.

TODO: describe lambda expressions with named parameters together with the
rules for implicit variable introduction.
