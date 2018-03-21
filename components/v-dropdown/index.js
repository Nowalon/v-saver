'use strict';

const Vue = require('vue/dist/vue.min.js')

var bus = new Vue();

Vue.component('v-dropdown', {
  template: `
    <div class="v-dropdown-el-wrap">
      <span
        class="dropdown-el"
        :class="{'expanded' : isExpanded}"
        @click.stop="handleClickPrettySelectDropdown">

        <template v-for="option, index in selectOptions">
          <input type="radio" :name="selectName" :value="option.value" :id="'v-select-item-' +selectName + '-' + index" v-model="value" :key="'v-dropdown-input-' + index + '-' + selectName">
          <label :for="'v-select-item-' +selectName + '-' + index" :key="'v-dropdown-label-' + index + '-' + selectName">{{ option.label }}</label>
        </template>

      </span>
    </div>`,
  props: {
    value: {
      type: String,
      default: '',
      required: true
    },
    selectOptions: {
      type: Array,
      default: [],
      required: true
    },
    selectName: {
      type: String,
      default: '',
      required: true
    }
  },

  data: () => ({
    isExpanded: false
  }),

  mounted () {
    var self = this;

    bus.$on('v-dropdown-opened', exceptNameValue => {
      self.handleCloseOtherVDropdowns(exceptNameValue);
    });

    document.addEventListener('click', () => {
      self.isExpanded = false;
    }, false);

  },


  methods: {

    updateValue (value) {
        this.$emit('input', value)
    },

    handleCloseOtherVDropdowns (exceptName) {
      if (this.selectName !== exceptName){
        this.isExpanded = false;
      }
    },

    handleClickPrettySelectDropdown (e) {
      e.preventDefault();
      e.stopPropagation();
      var targetNode = e.target;
      var expandedClassName = 'expanded';
      var parentNode;
      if (!this.isExpanded) {
        bus.$emit('v-dropdown-opened', this.selectName)
      }
      if (targetNode.classList && targetNode.getAttribute('for')) {
        var input = document.getElementById(targetNode.getAttribute('for'));
        if (input && this.isExpanded) {
          this.updateValue(input.value)
        }
      }
      this.isExpanded = !this.isExpanded;
    }

  }

});
