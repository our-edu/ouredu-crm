// Marketing Workflow (Meta lead ads): Pages, Forms and Leads synced from Meta by the
// fcrm_meta_integration app. One place for their doctypes, routes and API methods.
import { call, toast } from 'frappe-ui'
import { createDialog } from '@/utils/dialogs'
import { usersStore } from '@/stores/users'

const API = 'fcrm_meta_integration.fcrm_meta_integration.portal'

export const MARKETING_ROLES = ['Marketing Manager', 'Marketing User']

export const marketing = {
  pages: {
    doctype: 'Meta Page',
    label: 'Pages',
    listRoute: 'Marketing Pages',
    docRoute: 'Marketing Page',
    param: 'pageId',
    titleField: 'page_name',
    emptyIcon: 'flag',
  },
  forms: {
    doctype: 'Meta Lead Form',
    label: 'Forms',
    listRoute: 'Marketing Forms',
    docRoute: 'Marketing Form',
    param: 'formId',
    titleField: 'form_name',
    emptyIcon: 'clipboard',
  },
  leads: {
    doctype: 'Meta Lead',
    label: 'Leads',
    listRoute: 'Marketing Leads',
    docRoute: 'Marketing Lead',
    param: 'leadId',
    titleField: 'lead_id',
    emptyIcon: 'user-plus',
  },
}

export function canUseMarketing() {
  const { hasRole, isAdmin } = usersStore()
  return isAdmin() || MARKETING_ROLES.some((role) => hasRole(role))
}

export function marketingApi(method, args = {}) {
  return call(`${API}.${method}`, args)
}

// Run a Meta action with a confirmation dialog (when `confirm` is given), report
// the outcome as a toast and return the result (undefined when it failed).
export async function runMarketingAction({ confirm, run, success }) {
  const execute = async () => {
    try {
      const result = await run()
      const message = success ? success(result) : null
      if (message) toast.success(message)
      return result
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }
  if (!confirm) return execute()

  return new Promise((resolve) => {
    createDialog({
      title: confirm.title,
      message: confirm.message,
      actions: [
        {
          label: confirm.label || __('Continue'),
          variant: 'solid',
          onClick: async (context) => {
            context.close()
            resolve(await execute())
          },
        },
      ],
    })
  })
}

export function errorMessage(error) {
  const message = error?.messages?.[0] || error?.message || String(error)
  // server messages can contain HTML (e.g. <br>): show them as plain text
  const div = document.createElement('div')
  div.innerHTML = message
  return div.textContent || div.innerText || message
}
