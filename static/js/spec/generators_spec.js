import {ShapeGenerator, Generator} from "st/generators"
import {ChordGenerator, MultiKeyChordGenerator} from "st/chord_generators"

import {
  KeySignature, ChromaticKeySignature, ChromaticScale, Chord
} from "st/music"

describe("generators", function() {
  describe("shape generators", function() {
    it("gets inversions of triad", function() {
      let g = new ShapeGenerator()
      expect(g.inversions([0, 2, 4])).toEqual([
        [0, 2, 4],
        [0, 2, 5],
        [0, 3, 5],
      ])
    })


    it("gets inversions of triad out of order", function() {
      let g = new ShapeGenerator()
      expect(g.inversions([4, 0, 2])).toEqual([
        [0, 2, 4],
        [0, 2, 5],
        [0, 3, 5],
      ])
    })

    it("gets inversions of seven", function() {
      let g = new ShapeGenerator()
      expect(g.inversions([0, 2, 4, 6])).toEqual([
        [0, 2, 4, 6],
        [0, 2, 4, 5],
        [0, 2, 3, 5],
        [0, 1, 3, 5],
      ])
    })

  })

  describe("smoothing", function() {
    it("ranks notes using individual minimizer", function() {
      let g = new Generator()
      g.lastNotes = ["C3", "C6"]

      let k = 0
      let available = [
        ["A2", "D6"],
        ["D3", "D6"],
      ]

      let nextNote = () => available[(k++) % available.length]
      let res = g.sortedCandidatesIndividual(2, nextNote)
      expect(res).toEqual([
        [4, available[1]],
        [5, available[0]],
      ])
    })
  })
})


describe("chord generator", function() {
  it("gets all chords for scale", function() {
    let generator = new ChordGenerator(new KeySignature(0))
    let chords = generator.allChords()

    expect(chords).toEqual([
      new Chord("C", "M"),
      new Chord("D", "m"),
      new Chord("E", "m"),
      new Chord("F", "M"),
      new Chord("G", "M"),
      new Chord("A", "m"),
      new Chord("B", "dim"),
    ])
  })

  it("gets triads by default", function() {
    let generator = new ChordGenerator(new KeySignature(0), {extensions: {}})
    expect(generator.allChords().map(c => c.toString())).toEqual([
      "C", "Dm", "Em", "F", "G", "Am", "Bdim",
    ])
  })

  it("gets seventh chords with the 7th extension or 4 notes", function() {
    let names = ["CM7", "Dm7", "Em7", "FM7", "G7", "Am7", "Bm7b5"]

    let generator = new ChordGenerator(new KeySignature(0), {extensions: {"7th": true}})
    expect(generator.allChords().map(c => c.toString())).toEqual(names)

    let legacy = new ChordGenerator(new KeySignature(0), {notes: 4})
    expect(legacy.allChords().map(c => c.toString())).toEqual(names)
  })

  it("adds the 9th and 11th", function() {
    let generator = new ChordGenerator(new KeySignature(0), {
      extensions: {"9th": true, "11th": true}
    })

    expect(generator.allChords()[0].toString()).toEqual("C(add9,11)")

    let full = new ChordGenerator(new KeySignature(0), {
      extensions: {"7th": true, "9th": true, "11th": true}
    })

    expect(full.allChords()[4].toString()).toEqual("G7(9,11)")
    for (let i = 0; i < 10; i++) {
      expect(full.nextChord()).toBeTruthy()
    }
  })

  it("adds natural extensions without a key", function() {
    let generator = new ChordGenerator(new ChromaticKeySignature(), {
      extensions: {"7th": true, "9th": true}
    })

    let names = generator.allChords().map(c => c.toString())
    expect(names.slice(0, 3)).toEqual(["CM7(9)", "C7(9)", "Cm7(9)"])
  })

  it("generates some chords without an error", function() {
    let generator = new ChordGenerator(new KeySignature(0))
    for (let i = 0; i < 10; i++) {
      let chord = generator.nextChord()
      expect(chord).toBeTruthy()
    }
  })

  describe("multi key chord generator", function() {
    it("should create generator", function() {
      let generator = new MultiKeyChordGenerator(new KeySignature(0))
      for (let i = 0; i < 10; i++) {
        let chord = generator.nextChord()
        expect(chord).toBeTruthy()
      }
    })
  })
})

