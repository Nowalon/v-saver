'use strict';

const Vue = require('vue/dist/vue.min.js')

var bus = new Vue();

Vue.component('v-confirm-action-state-button', {
  template: `
    <button class="conf-btn v-confirm-action-btn"
            @click.stop.prevent="handleClick"
            :class="{'confirm-required' : confirmRequired}"
            :style="buttonStyles"
            :disabled="disabled"
            >
      <span>{{ buttonText }}</span>
    </button>`,
  props: {
    defaultText: {
      type: String,
      default: 'Click',
      required: true
    },
    confirmText: {
      type: String,
      default: 'Confirm',
      required: false
    },
    disabled: {
      type: Boolean,
      default: false,
      required: false
    },
    confirmedHandler: {
      type: Function,
      default: null,
      required: true
    },
    firstActionHandler: {
      type: Function,
      default: null,
      required: false
    }
  },

  data () {
    return {
      confirmRequired: false,
      defaultWidth: null,
      minWidthAllowed: 74
    }
  },
  components: {
  },

  computed: {
    buttonText () {
      return this.confirmRequired ? this.confirmText : this.defaultText
    },

    buttonStyles () {
      return (this.confirmRequired && this.defaultWidth && this.defaultWidth > this.minWidthAllowed) ? `min-width: ${this.defaultWidth + 2}px;` : ''
    }
  },

  mounted () {
    this.confirmRequiredTimeout = 0
  },

  methods: {

    handleClick (e) {
      if (this.confirmRequired && this.confirmedHandler) {
        this.confirmedHandler()
      } else {
          if (this.firstActionHandler) {
            this.firstActionHandler();
          }
          if (e.currentTarget && e.currentTarget.clientWidth) {
          this.defaultWidth = e.currentTarget.clientWidth
        }
      }

      this.confirmRequired = !this.confirmRequired

      if (this.confirmRequired) {
        this.confirmRequiredTimeout && clearTimeout(this.confirmRequiredTimeout)
        this.confirmRequiredTimeout = setTimeout(() => {
          this.confirmRequired = false
        }, 3600)
      }
    }

  }

});
