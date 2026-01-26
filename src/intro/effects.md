# Effects

Fram is a statically typed programming language. The key feature of Fram's
type system is that it tracks not only the types of values, but also the
side effects that expressions may have when evaluated. The role of this
chapter is to explain basic concepts of Fram's effect system. In
[Effect Handlers](intro/effect-handlers.md) chapter, we explain how to define
and use user-defined effects and effect handlers.

## Basics

To start with, let's consider the `printStrLn` function, which prints a
string to the standard output, followed by a newline character. This function
has the following type.
```fram
String ->[IO] Unit
```
This type indicates that the function takes a string as an argument and
returns a unit value. The `[IO]` annotation attached to the arrow indicates
that calling this function may have the `IO` effect, which is a built-in
effect representing input/output operations.

## Purity and Totality

Not all functions in Fram have side effects. For example, consider the
following `factorial` function.
```fram
let rec factorial (n : Int) =
  if n == 0 then 1
  else n * factorial (n - 1)
```
The type of this function is `Int ->[] Int`. The empty effect annotation
`[]` indicates that this function is *pure*, meaning that:
1. it does not have any side effects when evaluated, and
2. it is deterministic, meaning that it always produces the same result for
   the same input value.

However, pure functions may have some observable effects, such as:
1. they may not terminate for some input values (e.g., an infinite loop), and
2. they may raise irrecoverable runtime errors, like division by zero, or
   asserting false conditions.

Some functions in Fram satisfy even stronger guarantees. For example, consider
the following `not` function.
```fram
let not b =
  if b then False else True
```
The type of this function is `Bool -> Bool`. Arrow types without any effect
annotations mean that the function is *total*. A total function satisfies the
criteria for purity, and in addition:
1. it always terminates and produces a result for all possible input values,
   and
2. it does not raise any runtime errors (other than stack overflow and
   out-of-memory errors, which are outside the control of the language).

The totality of functions is a very strong guarantee, but requires a compiler
to check termination of functions, which is undecidable in general. However,
Fram checks totality for very specific purposes (to enforce a relaxed form of
a value restriction on polymorphic and recursive definitions), thus there is
no need for very general termination checking. A function is considered total
if:
1. it does not call any non-total (in particular, recursive) functions, and
2. it does not pattern-match on non-positively recursive data types.

Moreover, functional arguments to higher-order functions are considered
non-total, unless they are explicitly annotated as total. Due to these
limitations, the user should not expect the compiler to be able to prove
totality of arbitrary functions. We advise relying on purity, and treat
totality as an internal compiler mechanism.

## Effect Polymorphism

Some higher-order functions are as pure as their arguments. For example,
consider the standard `List.map` function, which applies a given function to
each element of a list. The implementation of this function is as follows.
```fram
let rec map f xs =
  match xs with
  | []      => []
  | x :: xs => f x :: map f xs
  end
```
When this function is applied to a pure function, the overall effect of the
`map` function is also pure. On the other hand, this function may be used
to process lists with functions that have side effects. For example, the
following code reads a list of strings from the standard input, printing
each prompt before reading each string.
```fram
let readLines prompts =
  map (fn prompt => printStr prompt; readLine ()) prompts
```
This function clearly has the `[IO]` effect, because it uses `printStr` and
`readLine` functions.

To allow functions like `map` to be used with both pure and impure arguments,
Fram supports *effect polymorphism*. The type of the `map` function is
```fram
(A ->[E] B) -> List A ->[E] List B
```
for any possible types `A`, `B`, and effect `E`. Or more precisely, the `map`
function has a polymorphic type scheme
```fram
{type A, type B, type E} -> (A ->[E] B) -> List A ->[E] List B
```
(we will explain type schemes in more detail in the
[Named Parameters](intro/named-parameters.md) chapter). Here, the type
variable `E` represents an arbitrary effect. When we substitute a pure effect
`[]` for `E`, we get the pure type, but we can also substitute `[IO]` or any
other effect for `E`, to get the corresponding impure type.

One important limitation of the effect polymorphism in Fram is that functions
polymorphic in effects cannot be instantiated to total functions. For example,
consider the following function.
```fram
let applyTwice f x =
  f (f x)
```
The type of this function is `(A ->[E] A) -> A ->[E] A` for any type `A` and
effect `E`. However, when we apply this function to the `not` function
(`applyTwice not`), the resulting function is not considered total, even
though it always terminates. It is possible to define a total version of this
function by requiring the argument function to be total, as follows.
```fram
let applyTwiceTotal (f : _ -> _) x =
  f (f x)
```
However, this version is not effect-polymorphic, and can only be applied to
total functions. Again, this limitation does not pose a practical problem, as
long as we rely on purity rather than totality.

## Combining Multiple Effects

A single function may have more than one effect. For example, consider the
following function that maps a function over a list, printing each element
before applying the function.
```fram
let rec mapWithPrint f xs =
  match xs with
  | []      => []
  | x :: xs =>
      printStrLn x;
      f x :: mapWithPrint f xs
  end
```
The type of this function is
```fram
(String ->[E] B) -> List String ->[IO,E] List B
```
for any type `B` and effect `E`. Here, the effect annotation `[IO,E]`
indicates that this function may have both `IO` and `E` effects.
Note that the `printStrLn` function has the `IO` effect, but is used in context
where the `[IO,E]` effect is expected. It is possible to do so thanks to
*subeffecting*, which allows a function with a smaller effect to be used as
a function with a larger effect. In contrast to many other languages with
effect systems, in Fram effects are compared as sets, meaning that the order
of effects does not matter, and duplicate effects are ignored. Moreover,
effects have no tree-like structure, meaning that they are always flattened
into a set of effect variables/constants. For example, when we substitute
effect `[F,G,IO]` for effect variable `E` in the effect `[IO,E]`, we get the
effect `[IO,F,G,IO]`, which is equivalent to `[IO,F,G]`.

## Effect Inference

Fram has a very powerful effect inference mechanism, which automatically
infers effects, relieving the programmer from the burden of annotating
functions with effects. The effect inference algorithm correctly infers
effects even in the presence of higher-rank polymorphism (see
[Named Parameters](intro/named-parameters.md) chapter). This means that the
effect system of Fram is almost completely transparent to the programmer, who
only needs to understand basic concepts explained in this chapter and use
idiomatic Fram code.

However, the type reconstruction algorithm may sometimes require some
type annotations to be able to infer types, especially in the presence of
higher-rank polymorphism or code that uses the mechanism of methods. In such
cases, the programmer may need to provide type annotations, which may include
arrows with effect annotations. To tell the compiler to infer the effect
automatically, the programmer may use `->>` arrow notation, which is a
syntactic sugar for `->[_]` (wildcard `_` indicates that this part of the
type annotation should be inferred). For example, the `map` function may be
explicitly annotated with types, but leaving effects to be inferred
automatically.
```fram
let rec map {A, B} (f : A ->> B) (xs : List A) : List B =
  match xs with
  | []      => []
  | x :: xs => f x :: map f xs
  end
```

In practice, explicit effect annotations are rarely needed. However, when
the user defines their own datatypes that contain effectful functions as
fields, we advise providing explicit effect annotations for such functions,
even if they can be inferred automatically. This improves code readability,
speeds up the effect inference process, and helps to catch some mistakes early
(with more precise error messages).

### Understanding Effect Inference Errors

When the effect inference algorithm is unable to infer effects, it may
produce error messages that may be hard to understand. In such cases, it may
help to provide explicit effect annotations in strategic places in the code,
to guide the effect inference algorithm. In particular, providing explicit
names for effect variables introduced in type schemes or effect handlers may
help to understand which parts of the code cause the effect inference to fail.
Sometimes, the effect pretty-printer may produce effects where some effect
variables are followed by a question mark (e.g., `E?`). This indicates that
the decision whether to include this effect variable in the final effect
is deferred until more information is available. Effect variables (as well
as type variables) that start with a hash sign (e.g., `#E`) are concrete
variables that are not printable, i.e., they have no explicit names in the
source or their names were shadowed by other definitions.
