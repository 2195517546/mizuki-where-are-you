<script setup>
import { ref, reactive, nextTick, watch } from 'vue'

const props = defineProps({
  terminalData: {
    type: Object,
    required: true
  },
  rootUnlocked: {
    type: Boolean,
    default: false
  },
  escapeExecuted: {
    type: Boolean,
    default: false
  },
  yllxExecuted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['unlock-root', 'execute-escape', 'execute-yllx', 'win'])

const terminalInput = ref('')
const terminalHistory = reactive([
  { type: 'output', text: 'MZK Terminal v1.0' },
  { type: 'output', text: 'Type "help" for available commands.' }
])
const terminalRef = ref(null)
const currentDir = ref('~')

function executeCommand() {
  const cmd = terminalInput.value.trim()
  if (!cmd) return

  terminalHistory.push({ type: 'input', text: `${currentDir.value}$ ${cmd}` })
  terminalInput.value = ''

  const parts = cmd.split(' ')
  const command = parts[0].toLowerCase()
  const args = parts.slice(1)

  let output = ''

  switch (command) {
    case 'help':
      output = props.terminalData.commands.help
      break
    case 'ls':
      if (props.rootUnlocked) {
        output = props.terminalData.commands.ls_root
      } else {
        output = props.terminalData.commands.ls
      }
      break
    case 'cat':
      if (args[0] === 'secret.txt' && props.rootUnlocked) {
        output = props.terminalData.commands.cat_secret
      } else if (args[0] === 'readme.txt') {
        output = props.terminalData.commands.cat_readme
      } else {
        output = 'cat: file not found'
      }
      break
    case 'su':
      if (args[0] === 'root') {
        if (args[1] === 'mizuki') {
          output = 'Root access granted.'
          emit('unlock-root')
        } else {
          output = 'su: incorrect password'
        }
      } else {
        output = 'su: user not found'
      }
      break
    case 'escape':
      if (props.rootUnlocked && !props.escapeExecuted) {
        output = props.terminalData.commands.escape
        emit('execute-escape')
      } else if (props.escapeExecuted) {
        output = 'escape: already executed'
      } else {
        output = 'escape: permission denied'
      }
      break
    case 'yllx':
      if (props.rootUnlocked && props.escapeExecuted && !props.yllxExecuted) {
        output = props.terminalData.commands.yllx
        emit('execute-yllx')
        setTimeout(() => {
          emit('win')
        }, 1000)
      } else if (props.yllxExecuted) {
        output = 'yllx: already executed'
      } else if (!props.escapeExecuted) {
        output = 'yllx: run "escape" first'
      } else {
        output = 'yllx: permission denied'
      }
      break
    case 'clear':
      terminalHistory.length = 0
      return
    default:
      output = `${command}: command not found`
  }

  terminalHistory.push({ type: 'output', text: output })
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  })
}

watch(() => props.rootUnlocked, (val) => {
  if (val) {
    currentDir.value = '/root'
  }
})
</script>

<template>
  <div class="terminal-app">
    <div ref="terminalRef" class="terminal-output">
      <div v-for="(line, i) in terminalHistory" :key="i" :class="['terminal-line', line.type]">
        <pre>{{ line.text }}</pre>
      </div>
    </div>
    <div class="terminal-input-row">
      <span class="terminal-prompt">{{ currentDir }}$</span>
      <input
        v-model="terminalInput"
        class="terminal-input"
        @keyup.enter="executeCommand"
        autofocus
      />
    </div>
  </div>
</template>

<style scoped>
.terminal-app {
  background: #000;
  color: #0f0;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-md);
}

.terminal-output {
  flex: 1;
  overflow-y: auto;
  margin-bottom: var(--spacing-md);
}

.terminal-line {
  margin-bottom: var(--spacing-xs);
}

.terminal-line pre {
  margin: 0;
  font-family: inherit;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.terminal-line.input {
  color: #fff;
}

.terminal-line.output {
  color: #0f0;
}

.terminal-input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.terminal-prompt {
  color: #0f0;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-family: inherit;
  font-size: var(--font-size-sm);
  outline: none;
  caret-color: #0f0;
}
</style>
