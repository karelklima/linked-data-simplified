//import { $ID, $META, $OPTIONAL, $TYPE } from 'schema/keys'
//import { expandSchema, getSchemaProperties } from 'schema/utils'
//import { schema, xsd } from 'namespaces'
//import { Schema } from 'schema/schema'
import { createAccess, createContext } from 'index'

import { DirectorSchema, MovieSchema, store } from './store'

describe('access/access', () => {
  const context = createContext(store)
  const directors = createAccess(DirectorSchema, context)
  const movies = createAccess(MovieSchema, context)

  test.only('should find an entity and its properties', (done) => {
    directors.findByIri('https://QuentinTarantino').subscribe((result) => {
      expect(result.name).toBe('Quentin Tarantino')
      done()
    })
  })

  test('should list all directors', (done) => {
    directors.find().subscribe((results) => {
      expect(results.length).toBe(2)
      expect(results[0].name).not.toBe(results[1].name)
      done()
    })
  })

  test('should find movie and its director', (done) => {
    movies.findByIri(`https://2001`).subscribe((result) => {
      expect(result.name).toBe('2001: A Space Odyssey')
      expect(result.director.name).toBe('Stanley Kubrick')
      done()
    })
  })

  /* test('accepts schema prototype as schema interface creates schema interface from schema prototype', () => {
    const s = expandSchema(User)
    expect(s).toEqual(UserSchema)
  })

  test('getSchemaProperties', () => {
    const properties = getSchemaProperties(UserSchema)
    const { firstName, lastName, email } = UserSchema
    const targetProperties = { firstName, lastName, email }
    expect(properties).toEqual(targetProperties)
  }) */
})
