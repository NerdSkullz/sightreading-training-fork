import {Chord, MajorScale, MinorScale, MajorBluesScale, HarmonicMinorScale, AscendingMelodicMinorScale, KeySignature} from "st/music"
import {dithered, shuffled} from "st/util"

import MersenneTwister from "mersennetwister"

// names of the extension toggles, mapped to the chord tone they add
export const CHORD_EXTENSIONS = {
  "7th": 7,
  "9th": 9,
  "11th": 11,
}

// names of the progression options, mapped to the scale degrees they step
// through. Whenever one of these chords comes up, the rest of the progression
// follows it, eg. for ii-V-I a ii is always followed by V then I, and a V is
// always followed by I. "random" isn't listed: it has no progression
export const CHORD_PROGRESSIONS = {
  "ii-V-I": [2, 5, 1],
}

export class ChordGenerator {
  constructor(keySignature, opts={}) {
    this.noteCount = opts.notes || 3

    // tones added on top of the triad, eg. [7, 9]
    if (opts.extensions) {
      this.extensions = Object.keys(CHORD_EXTENSIONS)
        .filter(name => opts.extensions[name])
        .map(name => CHORD_EXTENSIONS[name])
    } else {
      this.extensions = this.noteCount >= 4 ? [7] : []
    }

    this.keySignature = keySignature
    if (opts.commonNotes > 0) {
      this.commonNotes = opts.commonNotes
    }

    // chromatic chords aren't built on scale degrees, so progressions only
    // apply to keys
    if (CHORD_PROGRESSIONS[opts.chordProgression] && !keySignature.isChromatic()) {
      this.progression = CHORD_PROGRESSIONS[opts.chordProgression]
    }

    this.generator = new MersenneTwister()

    if (keySignature.isChromatic()) {
      this.scale = keySignature.defaultScale()
    } else {
      switch (opts.scale) {
        case "major":
          this.scale = new MajorScale(keySignature.name())
          break
        case "natural minor":
          this.scale = new MinorScale(keySignature.name())
          break
        case "harmonic minor":
          this.scale = new HarmonicMinorScale(keySignature.name())
          break
        case "melodic minor":
          this.scale = new AscendingMelodicMinorScale(keySignature.name())
          break
        case "major blues":
          this.scale = new MajorBluesScale(keySignature.name())
          break
        default:
          this.scale = keySignature.defaultScale()
      }
    }
  }

  allChords() {
    if (!this.keySignature.isChromatic()) {
      return this.scale.allExtendedChords(this.extensions)
    }

    let out = []

    let shapes = this.extensions.includes(7) ? ["M7", "7", "m7"] : ["M", "m"]

    // without a key, use the natural 9th and 11th
    let tensions = []
    if (this.extensions.includes(9)) { tensions.push(14) }
    if (this.extensions.includes(11)) { tensions.push(17) }

    for (let i = 0; i < this.scale.steps.length; i++) {
      let degree = i + 1
      let root = this.scale.degreeToName(degree)

      shapes.forEach(s => {
        let tones = new Chord(root, s).tones()
        out.push(Chord.fromTones(root, [...tones, ...tensions]))
      })
    }

    return out
  }


  nextChord() {
    if (!this.chords) {
      this.chords = this.allChords()
      this.chordOccurrences = new Map
    }

    // carry on with the progression the last chord is part of. This takes
    // priority over common notes
    let step = this.progressionStep
    if (step != null && step + 1 < this.progression.length) {
      this.progressionStep = step + 1
      // chords are in scale degree order
      return this.pickChord(this.chords[this.progression[step + 1] - 1])
    }

    let availableChords = []
    this.chords.forEach(chord => {
      if (this.lastChord && (this.lastChord.toString() == chord.toString())) {
        return
      }

      if (this.commonNotes && this.lastChord) {
        let common = this.lastChord.countSharedNotes(chord)
        if (common < this.commonNotes) {
          return
        }
      }

      availableChords.push(chord)
    })

    let groupedByOccurence = {}
    availableChords.forEach(chord => {
      let count = this.chordOccurrences.get(chord.toString()) || 0;
      groupedByOccurence[count] = groupedByOccurence[count] || []
      groupedByOccurence[count].push(chord)
    })

    let chordGroups = Object.keys(groupedByOccurence).map(key =>
      [+key, shuffled(groupedByOccurence[key], this.generator)]
    )

    chordGroups.sort((a,b) => a[0] - b[0])
    availableChords = chordGroups.reduce((list, group) => list.concat(group[1]), [])

    let chord = dithered(availableChords, 3, this.generator)[0]

    if (this.progression) {
      // a random chord can start a progression, or join one part way through
      let step = this.progression.indexOf(this.chords.indexOf(chord) + 1)
      this.progressionStep = step >= 0 ? step : null
    }

    return this.pickChord(chord)
  }

  pickChord(chord) {
    this.lastChord = chord
    this.chordOccurrences.set(chord.toString(), (this.chordOccurrences.get(chord.toString()) || 0) + 1)
    return chord
  }
}

// chord generator that moves between all keys
export class MultiKeyChordGenerator extends ChordGenerator {
  constructor(keySignature, opts={}) {
    super(keySignature, opts)

    let keys = KeySignature.allKeySignatures()
    this.chordToKeys = {}
    for (let key of keys) {
      for (let chord of new MajorScale(key).allChords(this.noteCount)) {
        let cName = chord.toString()
        this.chordToKeys[cName] = this.chordToKeys[cName] || []
        this.chordToKeys[cName].push(key)
      }
    }
  }

  // find another key that uses the chord, that isn't the current key
  changeKeyFromChord(chord=this.lastChord) {
    // common key modulation
    let keys = this.chordToKeys[chord.toString()]

    if (!keys) {
      // chord doesn't have key, eg. A#m
      return
    }

    keys = keys.filter(key => key.name() != this.keySignature.name())
    if (!keys.length) {
      // some chords are only in one key
      return
    }

    let newKey = keys[this.generator.int() % keys.length]

    // console.warn(`Going from ${this.keySignature.name()} to ${newKey.name()}`)
    this.keySignature = newKey
    this.scale = this.keySignature.defaultScale()
    this.chords = null
  }

  nextChord() {
    if (this.lastChord) {
      // time to change keys?
      let r = this.generator.random()

      if (r < 0.2) {
        if (this.lastChord.isDominant() && r < 0.15) {
          let targets = this.lastChord.getSecondaryDominantTargets(this.noteCount)

          targets = targets.filter(t => {
            let name = t.toString()
            return !this.chords.find(other => other.toString() == name)
          })

          let target = targets[this.generator.int() % targets.length]
          this.changeKeyFromChord(target)
        } else {
          this.changeKeyFromChord(this.lastChord)
        }
      }
    }

    return super.nextChord()
  }
}

