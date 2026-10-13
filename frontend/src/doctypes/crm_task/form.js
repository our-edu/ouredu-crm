const REFERENCE_ROUTES = {
  'CRM Lead': (name) => ({ name: 'Lead', params: { leadId: name } }),
  'CRM Deal': (name) => ({ name: 'Deal', params: { dealId: name } }),
  'CRM Organization': (name) => ({
    name: 'Organization',
    params: { organizationId: name },
  }),
  Contact: (name) => ({ name: 'Contact', params: { contactId: name } }),
}

export class CRMTask {
  onRender() {
    if (this.doc.reference_doctype && this.doc.reference_docname) {
      let label = this.doc.reference_doctype.replace('CRM ', '')

      this.actions = [
        {
          name: 'Redirect Action',
          label: __('Open {0}', [label]),
          onClick: (close) => {
            if (!this.doc.reference_docname) return
            let toRoute = REFERENCE_ROUTES[this.doc.reference_doctype]
            if (!toRoute) return
            this.router.push(toRoute(this.doc.reference_docname))
            close?.()
          },
        },
      ]
    }
  }
}
