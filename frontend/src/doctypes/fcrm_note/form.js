export class FCRMNote {
  onRender() {
    if (this.doc.reference_doctype && this.doc.reference_docname) {
      let label = this.doc.reference_doctype.replace('CRM ', '')

      this.actions = [
        {
          name: 'Redirect Action',
          label: __('Open {0}', [label]),
          onClick: (close) => {
            if (!this.doc.reference_docname) return
            let routes = {
              'CRM Lead': { name: 'Lead', param: 'leadId' },
              'CRM Deal': { name: 'Deal', param: 'dealId' },
              'CRM Organization': { name: 'Organization', param: 'organizationId' },
              Contact: { name: 'Contact', param: 'contactId' },
            }
            let route = routes[this.doc.reference_doctype]
            if (!route) return
            this.router.push({
              name: route.name,
              params: { [route.param]: this.doc.reference_docname },
            })
            close?.()
          },
        },
      ]
    }
  }
}
