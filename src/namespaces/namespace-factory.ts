export type NamespacePrototype = {
  iri: string
  prefix: string
  terms: readonly string[]
}

type NamespacePrefix<Namespace extends NamespacePrototype> = Namespace['prefix']

type NamespaceObject<Namespace extends NamespacePrototype> = {
  [Term in Namespace['terms'][number]]: `${NamespacePrefix<Namespace>}${Term}`
}

export const namespaceFactory = <
  N extends NamespacePrototype,
  // I = NamespaceItems<N>,
  // P = NamespacePrefix<N>,
  O = NamespaceObject<N>
>(
  namespaceSpec: N
) =>
  Object.assign(
    //<X extends I>(f: [X]) =>
    //  `${namespaceSpec.prefix}:${f}` as `${string & P}${string & X}`,
    namespaceSpec.terms.reduce((acc, term) => {
      //acc[term] = `${namespaceSpec.prefix}${term}`
      acc[term] = `${namespaceSpec.iri}${term}`
      return acc
    }, {} as any),
    { $$namespace: namespaceSpec }
  ) as O
