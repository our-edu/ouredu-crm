export class CRMCallLog {
  async onRender() {
    try {
      const { email, phones } = await this.call(
        'ouredu_fcrm_customizations.api.entity_contacts.get_my_phone_numbers',
      )
      this._myEmail = email
      this._myNumbers = phones || []
    } catch (err) {
      console.error('Failed to load agent details', err)
      this._myEmail = null
      this._myNumbers = []
    }

    this.setAgentFields()

    // "from" stays a plain, always-editable text field - only the default
    // value is picked for the user; multiple numbers still just prefill the
    // first one, which the user can overwrite manually.
    if (!this.doc.from && this._myNumbers.length) {
      this.doc.from = this._myNumbers[0]
    }
  }

  type() {
    // Swap the client/agent numbers to match the new call direction.
    const to = this.doc.to
    this.doc.to = this.doc.from
    this.doc.from = to

    this.setAgentFields()
  }

  setAgentFields() {
    if (!this._myEmail) return
    // caller/receiver are Link(User) fields - only the agent's side has a
    // real User behind it, the other side is an external phone number.
    if (this.doc.type === 'Incoming') {
      this.doc.receiver = this._myEmail
      this.doc.caller = ''
    } else {
      this.doc.caller = this._myEmail
      this.doc.receiver = ''
    }
  }
}
