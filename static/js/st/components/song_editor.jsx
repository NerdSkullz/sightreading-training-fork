import * as React from "react"

import styles from "st/components/song_editor.module.css"

import { KeySignature } from "st/music"
import {readConfig, writeConfig} from "st/config"

export default class SongEditor extends React.Component {
  constructor(props) {
    super(props)

    this.codeInputRef = React.createRef()
    this.onCodeChange = e => this.updateCode(e.target.value)

    // the work in progress song is stored locally so it survives a reload
    let initial = readConfig("wip:newSong")
    if (initial) {
      // render the initial song
      window.setTimeout(() => {
        if (this.state.code == initial.code) {
          if (this.props.onCode) {
            this.props.onCode(initial.code)
          }
        }
      }, 0)
    }

    this.state = {
      code: this.props.code || (initial ? initial.code : null) || "",
    }
  }

  updateCode(code, callback) {
    this.setState({ code }, callback)
    writeConfig("wip:newSong", { code })

    if (this.props.onCode) {
      this.props.onCode(code)
    }
  }

  render() {
    return <div className={styles.song_editor}>
      <textarea
        ref={this.codeInputRef}
        placeholder="Type some LML"
        value={this.state.code}
        onChange={this.onCodeChange}></textarea>
    </div>
  }

  pressNote(note) {
    let input = this.codeInputRef.current
    if (!input) {
      return
    }

    let code = this.state.code

    let selectionStart = input.selectionStart
    let selectionEnd = input.selectionEnd

    let before = code.substring(0, input.selectionStart)
    let after = code.substring(input.selectionEnd, code.length)

    let keySignature = KeySignature.forCount(0)
    if (this.props.songNotes && this.props.songNotes.metadata) {
      keySignature = KeySignature.forCount(this.props.songNotes.metadata.keySignature || 0)
    }

    let [, noteName, , octave] = note.match(/([A-G])(#|b)?(\d+)/)

    let accidental = ""
    switch (keySignature.accidentalsForNote(note)) {
      case 0: {
        accidental = "="
        break
      }
      case 1: {
        accidental = "-"
        break
      }
      case -1: {
        accidental = "+"
        break
      }
    }

    let noteCode = noteName.toLowerCase() + accidental + octave

    if (before && !before.match(/\s$/)) {
      noteCode = " " + noteCode
    }

    if (after && !after.match(/^\s/)) {
      noteCode = noteCode + " "
    }

    this.updateCode(before + noteCode + after, () => {
      // make the modification using execCommand to ensure undo works
      input.value = code
      input.selectionStart = selectionStart
      input.selectionEnd = selectionEnd
      input.focus()
      document.execCommand("insertText", false, noteCode)
    })
  }
}
