import { map, switchMap, tap } from 'rxjs/operators'

import { bindingsQuery, quadsQuery } from 'engine/query'
import { Iri } from 'schema/iri'
import { Property, Schema, SchemaPrototype } from 'schema/schema'
import { SchemaInterface } from 'schema/interface'
import { expandSchema } from 'schema/utils'
import { $ARRAY, $ID, $META, $TYPE } from 'schema/keys'
import { findIrisQuery, getObjectByIrisQuery } from './query-builder'
import { fromRdf, Literal, Graph } from 'rdf'
import { EngineContext } from '../engine/context'

type EntityData = {
  schema: Schema
  graph: Graph
  pointer: Iri
}

const proxyHandler = {
  get: (target: EntityData, propertyAlias: string) => {
    const targetSchema = target.schema
    const targetObject = target.graph[target.pointer]
    if (!targetSchema[propertyAlias]) {
      throw new Error(
        `Unknown property ${propertyAlias} in schema of ${targetSchema[$TYPE]}`
      )
    }
    const property = targetSchema[propertyAlias] as Property
    const proxyValue = targetObject[property[$ID]]
    if (!proxyValue) {
      // No triple within the subgraph exists with the property alias
      return null
    }
    if (property[$META].includes($ARRAY)) {
      return proxyValue.map((item) => fromRdf(item as Literal))
    } else {
      return fromRdf(proxyValue[0] as Literal)
    }
  },
}

class Resource<S extends SchemaPrototype, I = SchemaInterface<S>> {
  private readonly schema: Schema
  private readonly context?: EngineContext

  constructor(schema: S, context?: EngineContext) {
    this.schema = expandSchema(schema)
    this.context = context
  }
  getTest() {
    return ({} as unknown) as I
  }
  createProxy(graph: Graph, pointer: Iri) {
    const target = {
      schema: this.schema,
      graph,
      pointer,
    }
    return (new Proxy(target, proxyHandler) as unknown) as I
  }
  find() {
    const q = findIrisQuery(this.schema)
    return bindingsQuery(q, this.context).pipe(
      map((bindings) => {
        return bindings.reduce((acc, binding) => {
          acc.push(binding.get('?iri').value)
          return acc
        }, new Array<Iri>())
      }),
      switchMap((iris) =>
        this.findByIri(iris).pipe(
          map((graph) => {
            return iris.map((iri) => this.createProxy(graph, iri)) as I[]
          })
        )
      )
    )
  }
  findByIri(iri: Iri | Iri[]) {
    const iris = Array.isArray(iri) ? iri : [iri]
    const q = getObjectByIrisQuery(iris, this.schema)
    return quadsQuery(q).pipe(tap((result) => console.log(result)))
  }
}

export const createResource = <T extends SchemaPrototype>(spec: T) =>
  new Resource(spec)
