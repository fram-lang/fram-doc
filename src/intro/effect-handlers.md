# Effect Handlers

Effect handlers are a powerful programming construct that allows the
programmer to define and manage computational effects in a modular way.
Among the various approaches to effect handlers, Fram supports *lexically
scoped effect handlers* (a.k.a. *lexical effect handlers*), where effect
instances are represented as first-class values called *effect capabilities*.
In combination with Fram's mechanism of implicit parameters, this allows for
a flexible and expressive way to handle effects in a scoped manner.

## Simple Example: Exceptions

Let us start with a simple example of implementing a well-known mechanism of
exceptions using Fram's effect primitives. First, we define a type that
represents the capability of raising exceptions with messages of type
`String`.
```fram
data Exn E =
  { raise : {X} -> String ->[E] X
  }
```

The `Exn` type is a record that contains a single field `raise`, which is a
function that throws an exception with a given message. The function is
polymorphic in the return type `X`, meaning that it never returns normally,
and can be used in any context. The whole `Exn` type is parametrized by an
effect `E`, that represents the effect of raising exceptions. Because we
can have multiple values of the `Exn` type parametrized by different effects,
we can have multiple independent exception handlers in the same program,
each handling exceptions of a different effect.

Let us now define a simple function that handles exceptions locally. As an
example, we define a `forAll` function that checks whether a given predicate
holds for all elements of a list. The implementation uses the standard `iter`
function (the `List` module should be imported beforehand) to traverse the
list, and raises an exception if the predicate fails for any element.
```fram
let forAll p (xs : List _) =
  handle exn = Exn
    { effect raise msg = False
    }
  in
  xs.iter (fn x => if not (p x) then exn.raise "predicate failed");
  True
```

Let us explain the code above, step by step. The `forAll` function takes a
predicate `p` and a list `xs` as arguments. The core of the function is the
`handle` expression, which resembles a `let` binding: it introduces a new
variable `exn` of type `Exn` which represents the capability of raising
exceptions. The `handle` expression also introduces a new type variable
of the `effect` kind (the variable is anonymous in this case) that represents
the effect handled by this handler.

We initialize the effect capability `exn` with a record that defines the
implementation of the `raise` operation. The notation `effect raise msg = ...`
is a syntactic sugar for `raise = effect msg => ...`, where
`effect msg => ...` can be seen as a special lambda abstraction that takes an
argument `msg`, but executes the body in the context of the effect handler
instead of the caller. In other words, when `exn.raise` is called, the control
is transferred to the effect handler, that executes the body of the `raise`
operation, which in turn results in returning `False` from the `forAll`
function, without continuing the iteration. The `effect` lambda abstractions
can be used only within the handler (or explicitly connected to it via *effect
labels* explained later). The type of such abstractions is annotated with the
effect introduced by the handler. In this case the type of `raise` is
`String ->[E] X`, where `E` is the effect introduced by the handler.

The rest of the `forAll` function is straightforward: it iterates
over the list, and if the predicate fails for any element, it raises an
exception using the `exn.raise` operation. If the iteration completes
without raising an exception, the function returns `True`.

## Effect Capabilities as Implicit Parameters

Effect capabilities in Fram are represented as first-class values that can be
passed around and stored in data structures. On the other hand, each function
that uses an effect capability must have access to it in its scope. To avoid
the boilerplate of passing effect capabilities explicitly through all
functions that need them, Fram leverages its mechanism of implicit parameters.
For example, when we have several functions that can throw exceptions, we can
declare an implicit parameter of type `Exn`. Thanks to the mechanism of
sections, the declared effect capability is automatically passed to all
functions that need it, without the need to pass it explicitly.
```fram
parameter ~exn : Exn _

let checkPositive (x : Int) =
  if x < 0 then ~exn.raise "negative number"

let checkAllPositive (xs : List Int) =
  List.iter checkPositive xs

let positiveList xs =
  handle ~exn = Exn
    { effect raise msg = False
    }
  in
  checkAllPositive xs;
  True
```

In the code above, functions `checkPositive` and `checkAllPositive` use the
implicit parameter `~exn` (directly and indirectly, respectively) to raise
exceptions. The `positiveList` function defines an implicit parameter `~exn`
that will be implicitly passed to all functions that need it within its scope.

Additionally, to increase the readability of type-error messages, it is good
practice to name the effect parameter of the `~exn` capability. To do so, the
first line of the above example can be modified as follows.
```fram
parameter E_exn
parameter ~exn : Exn E_exn
```

Similarly, we can provide explicit names for effects introduced by the `handle`
expression.
```fram
let positiveList xs =
  handle ~exn / E_exn = Exn
    { effect raise msg = False
    }
  in
  checkAllPositive xs;
  True
```

## Resuming Effects

What makes effect handlers truly powerful is the ability to resume the
computation that raised the effect. This allows for implementing advanced
control-flow mechanisms, such as coroutines, generators, and backtracking.
Let us illustrate this with the following implementation of generators.
```fram
data Gen X =
  { run : {E} -> (X ->[E] Unit) ->[E] Unit
  }
```
The `Gen` type represents a generator that produces values of type `X`. It is
implemented as a record with a single field `run`, which is a function that
takes an implementation of the `yield` operation as an argument. The `run` function
is polymorphic in the effect `E`, which represents the effect of yielding values.
Creating a generator is simple: we just need to call the `yield` function on
each value we want to produce.
```fram
let exampleGen = Gen
  { run yield =
      yield 1;
      yield 2;
      yield 3
  }

let listToGen xs = Gen { run yield = xs.iter yield }
```
To consume values from a generator, we need to provide an implementation of the
`yield` operation. Consider the following `toList` method that collects all
elements produced by a generator into a list.
```fram
method toList (self : Gen _) =
  handle yield = effect x => x :: resume () in
  self.run yield;
  []
```
The above implementation may look cryptic for readers unfamiliar with effect
handlers, so let us explain it in detail. The `toList` method takes a
generator `self` as an argument, and creates a local effect using the `handle`
expression. This time, the effect capability `yield` is not a record, but an
effectful function defined using the `effect` keyword. The body of the effect
handler creates a list with the yielded value `x` as the head. To produce the
rest of the list, we call `resume ()`, which resumes the computation of the
generator from the point where it yielded the value `x`. The `resume` function
takes an argument of type `Unit` in this case, because the `Unit` type is the
return type of the `yield` function. Fram implements so-called *deep
handlers*, which means that subsequent uses of `yield` will be handled by the
same handler, but executed in the call site of the `resume` function.
Therefore, the values yielded during the resumed computation will be placed
after `x` in the resulting list.

After defining the effect handler, we call the `run` method of the generator,
passing the `yield` effect capability as an argument. Finally, after the
generator has finished producing values, we return an empty list, to which the
yielded values will be prepended by the effect handler.

The above code can also be rewritten as follows.
```fram
method toList (self : Gen _) =
  handle yield = effect x / r => x :: r ()
  return () => []
  in
  self.run yield
```

There are two differences compared to the previous version. First, in the
implementation of the `yield` operation we explicitly name the resumption
(a function that resumes the computation) as `r`, and use it in the body.
In fact, the `effect x => ...` construct that does not name the resumption
always introduces a resumption named `resume`. In other words, it is just a
syntactic sugar for `effect x / resume => ...`. Second, we use the `return`
clause of the `handle` expression to define the value that will be returned
when the computation being handled completes normally (i.e., without raising
any effects). In most cases, `handle ... return x => e in ...` is equivalent
to `handle ... let x = ... in e`. The minor difference is that the body of the
return clause is evaluated in the context of the effect handler (same as the
bodies of the `effect` functions), where the subsequent effects will not be
handled by the current handler. Using explicit return clauses increases
readability, and might be necessary when defining first-class effect handlers
(explained later).

It is worth noting that to use generators implemented this way, we do not need
to always create a local effect handler. Since the `run` method is polymorphic
in the effect `E`, we can reuse existing effects, or even instantiate it with
the pure effect. For example, we can define the following function that
iterates over a generator and applies a given function to each produced value.
```fram
method iter (self : Gen _) f = self.run f
```

## Backtracking

The ability to resume computations allows us to implement advanced control
flow mechanisms. For instance, we can implement a backtracking mechanism using
only features that we have seen so far. Let us start by defining a type of
backtracking capability.
```fram
data BT E =
  { flip : Unit ->[E] Bool
  , fail : {X} -> Unit ->[E] X
  }
```

The `BT` type is a record type that contains two operations: `flip`, which
nondeterministically returns either `True` or `False`, and `fail`, which
aborts the current computation and backtracks to some choice point and tries
another alternative. On top of that, we can define more convenient operations,
such as `assert` that fails if a given condition is `False`, and `select`,
which selects a number from a given range.
```fram
method assert (self : BT _) cond =
  if not cond then self.fail ()

method rec select (self : BT _) (a : Int) (b : Int) =
  self.assert (a <= b);
  if self.flip () then a else self.select (a + 1) b
```

The `assert` method uses the `fail` operation to abort the computation if the
condition is not met. The `select` method uses `flip` to choose between the
first number in the range and recursively selecting from the rest of the range.

As an example of using the backtracking capability, let us define a function
that finds a Pythagorean triple.
```fram
parameter E_bt
parameter ~bt : BT E_bt

let triples n =
  let a = ~bt.select 1 n in
  let b = ~bt.select a n in
  let c = ~bt.select b n in
  ~bt.assert (a * a + b * b == c * c);
  (a, b, c)
```

The implementation of the `triples` function is straightforward: it selects
three numbers `a`, `b`, and `c`, ensures that they form a Pythagorean triple,
and returns them as a tuple. If the assertion fails, the computation
backtracks and tries different values for `a`, `b`, and `c`. However, to
actually run this function we need to provide a `~bt` effect capability. We
can do this using a local effect handler that collects all possible results
into a list.
```fram
let allTriples n =
  handle ~bt = BT
    { effect flip () = resume True + resume False
    , effect fail () = []
    }
  return t => [t]
  in
  triples n
```
Let us explain the effect handler above. The `fail` operation is similar to
the exception handler we have seen earlier: it simply returns an empty list,
aborting the current computation. However, the `flip` operation is more
interesting: it resumes the computation twice, once returning `True` and once
returning `False`, and combines the results using the list concatenation. The
handler also defines a `return` clause that wraps the successfully computed
triple (the result of the `triples` function) into a singleton list, as the
final result of the handler is a list of all possible triples.

One of the benefits of using effect handlers to implement various control-flow
mechanisms is that they naturally distinguish between the definition of the
effectful computations (defined using given interface of effect capabilities)
and the actual interpretation of the effects (defined using effect handlers).
This increases modularity and code reuse, as the same effectful computation
can be interpreted in different ways by providing different effect handlers.
For instance, we can easily define a different backtracking handler that stops
at the first successful result instead of collecting all results.
```fram
let anyTriple n =
  handle ~bt = BT
    { effect flip () =
      match resume True with
      | Some t => Some t
      | None   => resume False
      end
    , effect fail () = None
    }
  return t => Some t
  in
  triples n
```

This time, the handler returns an `Option` type. The `flip` operation tries to
resume the computation with `True`, and if it succeeds (returns `Some t`), it
returns that result. If it fails, it resumes the computation with `False`.

## State Idiom

A common use case of effect handlers is to implement local mutable state.
However, this usage is somewhat unintuitive, so
it deserves a dedicated explanation. Let us start by defining a type that
represents the capability of a single mutable cell, with two operations:
`get` and `set`.
```fram
data State X E =
  { get : Unit ->[E] X
  , set : X ->[E] Unit
  }
```

The standard library defines an operator `(:=)` as a shorthand for the `set`
method, so we can use a more familiar syntax when working with mutable state.
```fram
let increment (cell : State Int _) =
  cell := cell.get () + 1
```

An implementation of a local state handler is a bit tricky. The key idea is to
write a handler that evaluates to a function that takes the current state, and
immediately apply it to the initial value. For example, the following code
computes the length of a list by incrementing a mutable cell for each element.
```fram
let statefulLength (xs : List _) =
  let f =
    handle cell = State
      { effect get () = fn st => resume st st
      , effect set st = fn _  => resume () st
      }
    return v => fn _ => v
    in
    xs.iter (fn _ => increment cell);
    cell.get ()
  in
  f 0
```

The `get` operation immediately returns a function that takes the current
value of the state `st`, and resumes the computation with that value. Since
the resumption contains the entire handler, a call to `resume st` will return
a function that expects the current state again, so we pass the unchanged
state as the second argument. The `set` operation is similar: it returns a
function that discards the current value of state (matched by the wildcard `_`
pattern), and resumes the computation with the unit value, passing the new
state `st` as the second argument. When the computation being handled
completes normally, the `return` clause returns a function that discards the
current state and returns the final value `v`. Finally, we apply the function
returned by the handler to the initial state `0`.

This final application of the function is a part of the handler logic, but
it cannot be done in the body of the `handle` expression itself, because the
initial value should not be captured as a part of a resumption. To allow
cleanly connecting a handler with some code around it, Fram provides a special
`finally` clause for the `handle` expression. The `finally` clause describes
what to do with the result of the handler, but is not captured by the
resumptions. Using the `finally` clause, we can rewrite the above code as
follows.
```fram
let statefulLength (xs : List _) =
  handle cell = State
    { effect get () = fn st => resume st st
    , effect set st = fn _  => resume () st
    }
  return v => fn _ => v
  finally f => f 0
  in
  xs.iter (fn _ => increment cell);
  cell.get ()
```

## First-Class Effect Handlers

To support more modular and reusable code, Fram allows effect handlers to be
defined once and used in multiple `handle` expressions. Such first-class
effect handlers are defined by putting the value of the effect capability
together with optional `return` and `finally` clauses between `handler` and
`end` keywords. For example, first-class versions of some of the handlers we
have seen earlier in this chapter can be defined as follows (with one
additional `hBT_iter` handler that will be needed in the next section).
```fram
## Collect all results into a list
let hBT_all =
  handler BT
    { effect flip () = resume True + resume False
    , effect fail () = []
    }
  return t => [t]
  end

## Return the first successful result (if any)
let hBT_any =
  handler BT
    { effect flip () =
        match resume True with
        | Some t => Some t
        | None   => resume False
        end
    , effect fail () = None
    }
  return t => Some t
  end

## Iterate over all possibilities
let hBT_iter =
  handler BT
    { effect flip () = resume True; resume False
    , effect fail () = ()
    }
  end

## State handler
let hState init =
  handler State
    { effect get () = fn st => resume st st
    , effect set st = fn _  => resume () st
    }
  return v => fn _ => v
  finally f => f init
  end
```

The last of the above handlers, `hState` is in fact a function that takes the
initial state as an argument, and returns an effect handler. Note that
first-class handlers do not name the effect capability. The effect capability
is introduced by the `handle` expression that uses the handler.

To use a first-class effect handler, we use it in a `handle` expression,
where instead of providing the effect capability definition, we just refer to
the first-class handler using `with` keyword. For example, we can rewrite
the `allTriples` and `statefulLength` functions as follows.
```fram
let allTriples n =
  handle ~bt with hBT_all in
  triples n

let statefulLength (xs : List _) =
  handle cell with hState 0 in
  xs.iter (fn _ => increment cell);
  cell.get ()
```

In fact, `handle x = ... in ...` is just a syntactic sugar for
`handle x with handler ... end in ...`, so both forms are equivalent.

## Composing Effects

Using effect handlers to express and manage computational effects allows for
composing multiple effects in a clean and modular way. A computation can have
multiple effects, each handled by its own effect handler. For instance, we can
write a function that finds all Pythagorean triples (using backtracking),
prints them (using built-in `IO` effect), and counts how many triples were found
(using local mutable state).
```fram
let countAndPrintTriples n =
  handle numTriples with hState 0
  let _ =
    handle ~bt with hBT_iter
    let triple = triples n
    in
    printStrLn triple.show;
    increment numTriples
  in
  numTriples.get ()
```

It is worth noting that the order of effect handlers matters. While some
effect handlers can commute (for example, two independent state handlers),
others cannot. For example, consider the following code that uses state and
backtracking effects.
```fram
let example n =
  handle cell with hState 0
  handle ~bt with hBT_all
  in
  triples n;
  increment cell;
  cell.get ()
```

It first creates a mutable cell, which then is incremented for each found
triple. The backtracking handler collects all values of the cell into a list,
which results in a list of consecutive integers from `1` to the number of
found triples. However, if we swap the order of the handlers as follows,
```fram
let example n =
  handle ~bt with hBT_all
  handle cell with hState 0
  in
  triples n;
  increment cell;
  cell.get ()
```
we get a different result: since the state handler is local to each possible
path of the backtracking computation, the cell is always `0` when it is
incremented, resulting in a list where all elements are `1`.

## Global Effect Handlers

In Fram, the `handle` construct is in fact a definition, similarly to `let` or
`data` definitions. This means that effect handlers can be defined at the top
level of a module, making them globally available within the module itself
and to other modules that import it. This allows for defining global effects
that can be used throughout the program. For example, we can define a global
logging effect that collects log messages into a list (in reverse order).
```fram
pub handle logger / Log with hState []

pub let log msg =
  logger := msg :: logger.get ()
```

## Type Discipline of Lexically Scoped Effect Handlers

Fram's type and effect system ensures that all effects raised within a
computation are properly handled. In order to make sure that effectful
functions that are part of effect capabilities are never called outside
the scope of their corresponding effect handlers, the `handle` construct
introduces a new effect variable that is used to annotate the types of
effectful operations defined within the handler. Similarly to locally
defined datatypes, this effect variable cannot escape the scope of the
handler. For instance, the following code is rejected by the type checker,
because the type of the returned value (`Int ->[E] Unit`) mentions the local
effect variable `E`.
```fram
let badHandler =
  handle st / E with hState 0 in
  st.set
```

The effect variable may also escape via types of arguments. For instance,
in the following code, the type inference algorithm deduces that the `f`
function expects an argument of type `State Int E`, where `E` is the local
effect variable introduced by the handler.
```fram
let callWithFreshState f =
  handle st / E with hState 0 in
  f st
```

However, the code similar to the one above might be useful in some cases,
when the programmer wants to define a higher-order function handling some
effect for its argument. To allow for such use cases, it is needed to
explicitly annotate the argument with a type that is polymorphic in the effect
of the effect capability.
```fram
let callWithFreshState (f : {E} -> State Int E ->[E] _) =
  handle st / E with hState 0 in
  f st
```

Interestingly, Fram's powerful effect inference mechanism is able to deduce
the correct polymorphic type for the `f` argument if it is only annotated
as a function polymorphic in effects, without mentioning how the effect
is used in the argument. The code below is accepted by the type checker.
```fram
let callWithFreshState (f : {E : effect} -> _) =
  handle st / E with hState 0 in
  f st
```

However, we advise to use the more precise type annotation shown earlier,
because it increases code readability, helps to catch potential type errors,
and improves the performance of the type inference algorithm.

## Effect Labels

In some cases, it might be useful to use `effect` lambda abstraction in
some helper function that is not directly defined within the body of the
`handle` expression. To allow for such use cases, the `effect` abstraction
can be annotated with an *effect label* that connects it to a specific
effect handler. Effect labels are first-class values, so they can be passed
around. For example, we can define helper functions that implement `get`
and `set` operations for the state effect as follows, assuming that the effect
label `lbl` is passed as an argument.
```fram
let defaultGet lbl =
  lbl.effect () => fn st => resume st st

let defaultSet lbl =
  lbl.effect st => fn _  => resume () st
```

To use such helper functions within an effect handler, we need to pass the
effect label corresponding to the handler. In Fram, each handler introduces
its own effect label, and binds it to a special implicit `~label`. Thus,
we can rewrite the `hState` first-class handler as follows.
```fram
let hState init =
  handler State
    { get = defaultGet ~label
    , set = defaultSet ~label
    }
  return v => fn _ => v
  finally f => f init
  end
```

In fact, the `effect x => ...` construct used in the previous examples is just
a syntactic sugar for `~label.effect x => ...`, so we can rewrite the above
code to use implicit parameters in a more idiomatic way.
```fram
let defaultGet {~label} =
  effect () => fn st => resume st st

let defaultSet {~label} =
  effect st => fn _  => resume () st

let hState init =
  handler State
    { get = defaultGet
    , set = defaultSet
    }
  return v => fn _ => v
  finally f => f init
  end
```
