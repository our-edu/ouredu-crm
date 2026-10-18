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

    // The Quick Entry form reuses a cached, unsaved document across separate
    // "new document" openings (it only resets on a successful create), so
    // always overwrite "from" fresh here instead of only filling it when
    // empty - otherwise a previous call's number lingers into the next one.
    this.doc.from = this._myNumbers[0] || ''
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
