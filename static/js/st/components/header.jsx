import * as React from "react"
import * as ReactDOM from "react-dom"
import {Link, NavLink} from "react-router-dom"

import {trigger} from "st/events"
import MidiButton from "st/components/midi_button"
import {IconDownArrow} from "st/components/icons"

import Lightbox from "st/components/lightbox"

import {toggleActive} from "st/components/util"

import styles from "./header.module.css"

class SizedElement extends React.Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  componentDidMount() {
    this.refreshWidth()

    let timeout = null
    this.resizeCallback = e => {
      if (timeout) {
        window.clearTimeout(timeout)
        timeout = null
      }

      timeout = window.setTimeout(() => {
        this.refreshWidth()
        timeout = null
      }, 100)
    }

    window.addEventListener("resize", this.resizeCallback)
    this.resizeCallback()
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeCallback)
  }

  refreshWidth() {
    let el = ReactDOM.findDOMNode(this)
    let width = el.getBoundingClientRect().width
    if (this.state.width != width) {
      this.setState({
        width: width
      }, function() {
        if (this.props.onWidth) {
          this.props.onWidth(this.state.width)
        }
      })
    }
  }

  render() {
    return <div className={this.props.className}>
      {this.state.width ? this.props.children : null}
    </div>
  }
}

export default class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      menuOpen: false
    }
  }

  renderNavigationMenu() {
    let userLinks = this.getPageLinks()

    let menu = null
    let showMidiButton = !this.state.width || this.state.width < 450


    if (this.state.menuOpen) {
      menu = <Lightbox
        key="navigation_menu"
        className={styles.navigation_menu}
        onClick={e => {
          if (e.target.matches("a")) {
            this.setState({ menuOpen: false })
          }
        }}
        onClose={(lb) => {
          this.setState({ menuOpen: false })
        }}
      >
        {showMidiButton ? <div className={styles.midi_button_wrapper}>{this.renderMidiButton()}</div> : null}
        <ul>
          {userLinks.map((link, i) => <li key={i}>{link}</li>)}
        </ul>
      </Lightbox>
    }

    return <div className={styles.menu_toggle}>
      <button type="button" onClick={e => {
        this.setState({ menuOpen: !this.state.menuOpen })
      }}>Menu {<IconDownArrow width={12}/>}</button>
      {menu ? <div
        onClick={e => this.setState({ menuOpen: false })}
        className={styles.menu_shroud}></div> : null}
      {menu}
    </div>
  }

  renderHorizontalNavigation() {
    return this.getPageLinks()
  }

  getPageLinks() {
    return [
      <NavLink end key="root" to="/" {...toggleActive}>Staff</NavLink>,
      <NavLink end key="ear-training" to="/ear-training/interval-melodies" {...toggleActive}>Ear Training</NavLink>,
      <NavLink end key="flash-cards" to="/flash-cards/note-math" {...toggleActive}>Flash Cards</NavLink>,
      <NavLink key="play-along" to="/play-along" {...toggleActive}>Play Along</NavLink>,
      <NavLink end key="about" to="/about" {...toggleActive}>Guide</NavLink>,
    ]
  }

  renderMidiButton() {
    return <MidiButton
      midiInput={this.props.midiInput}
      pickMidi={() => {
        trigger(this, "pickMidi")
      }} />
  }

  render() {
    let enableDropdown = this.state.width && this.state.width < 700
    let hideMidiButton = !this.state.width || this.state.width < 450

    return <div className={styles.header}>
      <Link to="/" className={styles.logo_link}>
        <img className={styles.logo} src="/static/img/logo.svg" height="35" alt="" />
        <img className={styles.logo_small} src="/static/img/logo-small.svg" height="35" alt="" />
      </Link>

      <SizedElement className={styles.user_links} onWidth={(w) => {
        this.setState({ width: w })
      }}>
        {enableDropdown ? this.renderNavigationMenu() : this.renderHorizontalNavigation()}
      </SizedElement>

      {hideMidiButton ? null : this.renderMidiButton()}
    </div>

  }
}
