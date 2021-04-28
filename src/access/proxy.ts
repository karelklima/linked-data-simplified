import { Iri } from 'schema/iri'
import { Property, Schema } from 'schema/schema'
import { $ARRAY, $CONTEXT, $ID, $META, $TYPE } from 'schema/keys'
import { fromRdf, Literal, Graph, NamedNode } from 'rdf'

type EntityData = {
  schema: Schema
  graph: Graph
  pointer: Iri
}

const proxyHandler = {
  get: (target: EntityData, propertyAlias: string): any => {
    const targetSchema = target.schema
    const targetObject = target.graph[target.pointer]
    if (!targetSchema[propertyAlias]) {
      throw new Error(
        `Unknown property ${propertyAlias} in schema of ${targetSchema[$TYPE]}`
      )
    }
    const property = targetSchema[propertyAlias] as Property

    const proxyValue = targetObject[property[$ID]]
    if (property[$CONTEXT]) {
      if (property['@meta'].includes($ARRAY)) {
        // We have an array!
        console.log('ARRAY HIT', propertyAlias)
        if (!proxyValue) {
          return []
        }
        return proxyValue.map((value) => {
          console.log(value)
          return new Proxy(
            {
              schema: property[$CONTEXT]!,
              graph: target.graph,
              pointer: (value as NamedNode).value,
            },
            proxyHandler
          )
        })
      } else {
        // Single value
        console.log('SINGLE HIT', propertyAlias)
        return new Proxy(
          {
            schema: property[$CONTEXT]!,
            graph: target.graph,
            pointer: (proxyValue[0] as NamedNode).value,
          },
          proxyHandler
        )
      }
    }
    if (!proxyValue) {
      // No triple within the subgraph exists with the property alias
      return null
    }
    if (property[$META].includes($ARRAY)) {
      console.log('ARRAY', proxyValue)
      return proxyValue.map((item) => fromRdf(item as Literal))
    } else {
      console.log('SINGLE', proxyValue)
      return Array.isArray(proxyValue)
        ? fromRdf(proxyValue[0] as Literal)
        : fromRdf(proxyValue)
      //console.log(val.value)
      //return fromRdf(val as Literal)
    }
  },
}

export const createProxy = (schema: Schema, graph: Graph, pointer: Iri) => {
  const target = {
    schema,
    graph,
    pointer,
  }
  return new Proxy(target, proxyHandler)
}
