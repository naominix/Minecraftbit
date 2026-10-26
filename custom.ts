/**
 * Minecraft:bit Custom blocks
 * Require : Minecraft:bit WebSocket Server
 * 
 * Hisashi Hoshino
 */

enum ChoiceCommand {
    //% block="tp"
    tp = 1,
    //% block="give"
    give = 2,
    //% block="execute"
    execute = 3,
    //% block="summon"
    summon = 4,
    //% block="effect"
    effect = 5,
    //% block="fill"
    fill = 6,
    //% block="playsound"
    playsound = 7,
    //% block="weather"
    weather = 8,
    //% block="time"
    time = 9
}

enum Target {
    //% block="すべてのプレイヤー@a"
    a = 1,
    //% block="自分のエージェント@c"
    c = 2,
    //% block="すべてのエンティティ@e"
    e = 3,
    //% block="最も近いプレイヤー@p"
    p = 4,
    //% block="ランダムなプレイヤー@r"
    r = 5,
    //% block="自分自身@s"
    s = 6
}

enum KeyMouseEvent {
    //% block="マウス左ボタンクリック"
    left = 1,
    //% block="マウス右ボタンクリック"
    right = 2,
    //% block="キー[W]"
    w = 3,
    //% block="キー[A]"
    a = 4,
    //% block="キー[S]"
    s = 5,
    //% block="キー[D]"
    d = 6,
    //% block="マウス左ボタンDown"
    L = 7,
    //% block="マウス右ボタンDown"
    R = 8,
    //% block="マウス左ボタンUP"
    j = 9,
    //% block="マウス右ボタンUP"
    k = 10,
}

enum ChoiceEvent {
    //% block="無効：全イベント"
    unsubsc = 0,
    //% block="プレイヤーが歩いた"
    ptravelled = 9,
    // //% block="無効：プレイヤーが歩いた"
    // usptravelled = 1,
    //% block="ブロックを置いた"
    blockplaced = 8,
    // //% block="無効：ブロックを置いた"
    // usblockplaced = 2,
    //% block="ブロックを壊した"
    blockbroken = 7,
    // //% block="無効：ブロックを壊した"
    // usblockbroken = 3,
    //% block="アイテムを使った"
    itemused = 6,
    // //% block="無効：アイテムを使った"
    // usitemused = 4,
    //% block="アイテムを落とした"
    itemdropped = 11,
    // //% block="無効：アイテムを落とした"
    // usitemdropped = 19,
    //% block="メッセージを送信した"
    message = 12,
    // //% block="無効：メッセージを送信した"
    // usmessage = 18,
    //% block="テレポートした"
    teleported = 13
    // //% block="無効：テレポートした"
    // usteleported = 17
}

//% weight=100 color=#0fbc11 icon="\uf1b3"
//% groups='["Connect","Event","Command"]'
namespace Minecraftbit {
    let isConnected: boolean = false;

    // ---- Serial protocol v2 (see protocol-v2-spec.md) ----
    // Frames are newline-terminated lines "MB:<kind>:<payload>*<CRC>"
    // where CRC is CRC-8/SMBus (polynomial 0x07, initial value 0) of
    // everything before the '*', as two uppercase hex digits. The PC
    // side verifies the checksum, so line noise can no longer turn
    // into key presses or clicks, and subscriptions are named
    // (MB:sub:BlockPlaced) instead of one-character codes.
    let v2Synced: boolean = false;
    let desiredSubs: string[] = [];

    function crc8(text: string): number {
        let crc = 0
        for (let i = 0; i < text.length; i++) {
            crc ^= text.charCodeAt(i)
            for (let j = 0; j < 8; j++) {
                if (crc & 0x80) {
                    crc = ((crc << 1) ^ 0x07) & 0xFF
                } else {
                    crc = (crc << 1) & 0xFF
                }
            }
        }
        return crc
    }

    function hex2(n: number): string {
        const digits = "0123456789ABCDEF"
        return digits.charAt((n >> 4) & 0xF) + digits.charAt(n & 0xF)
    }

    function v2Frame(kind: string, payload: string): string {
        const body = "MB:" + kind + ":" + payload
        return body + "*" + hex2(crc8(body))
    }

    function sendV2(kind: string, payload: string): void {
        serial.writeLine(v2Frame(kind, payload))
    }

    // Until the PC answers with hello/state, re-send our hello and
    // the full desired subscription set every 3 seconds. Whichever
    // side starts first, the subscriptions end up applied, and the
    // boot-time burst losses that used to drop some subscriptions
    // silently are healed by the retries.
    basic.forever(function () {
        if (isConnected && !v2Synced) {
            sendV2("hello", "2")
            for (let name of desiredSubs) {
                sendV2("sub", name)
                basic.pause(50)
            }
        }
        basic.pause(3000)
    })

    // Maps one event notification (legacy bare name, legacy " " for
    // travelled, or a v2 ev payload) to the registered handlers.
    function dispatchEvent(name: string): void {
        switch (name) {
            case 'BlockBroken':
                control.raiseEvent(11, 22)
                break;
            case 'BlockPlaced':
                control.raiseEvent(12, 22)
                break;
            case 'ItemDropped':
                control.raiseEvent(13, 22)
                break;
            case 'ItemUsed':
                control.raiseEvent(14, 22)
                break;
            case 'PlayerTeleported':
                control.raiseEvent(15, 22)
                break;
            case ' ':
            case 'PlayerTravelled':
                control.raiseEvent(16, 22)
                break;
            case 'PlayerMessage':
                control.raiseEvent(17, 22)
                break;
            default:
        }
    }

    /**
     * Connect Minecraft:bit via USB-Serial
     */
    //% blockId="mcbit_connect" block="🔗Minecraft:bitに接続"
    //% weight=100 color=#000080 blockGap=20
    //% group="Connect"
    export function connect(): void {
        serial.redirectToUSB()
        isConnected = true
        // Baud rate must match the PC side (mcwss-microbit opens the
        // port at 115200). It used to be 9600 here, which only worked
        // because USB CDC largely ignores the setting.
        serial.setBaudRate(BaudRate.BaudRate115200)
        serial.setRxBufferSize(128)
        basic.pause(100)
        sendV2("hello", "2")
    }

    /**
         * Write USB-Serial
         */
    //% blockId="serial_write" block="⛏️マイクラコマンド %command を送信"
    //% weight=100 blockGap=20
    //% command.defl="/tp ~~~"
    //% group="Command"
    export function sendMCCommand(command: string): void {
        sendV2("cmd", command)
        basic.pause(100)
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️ブロックを壊したとき"
    //% draggableParameters
    //% group="Event"
    export function onBlockBroken(cb: () => void) {
        control.onEvent(11, 22, function () {
            cb()
        })
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️ブロックを置いたとき"
    //% draggableParameters
    //% group="Event"
    export function onBlockPlaced(cb: () => void) {
        control.onEvent(12, 22, function () {
            cb()
        })
    }

    /**
     * TODO: describe your function here
     * @param value describe value here, eg: 5
     */
    //% weight=50
    //% block="⛏️アイテムを捨てたとき"
    //% draggableParameters
    //% group="Event"
    export function onItemDropped(cb: () => void) {
        control.onEvent(13, 22, function () {
            cb()
        })
    }

    //% block block="⛏️アイテムを使ったとき"
    //% group="Event"
    export function onItemUsed(cb: () => void): void {
        control.onEvent(14, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーがテレポートしたとき"
    //% group="Event"
    export function onTeleported(cb: () => void): void {
        control.onEvent(15, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーが歩いたとき"
    //% group="Event"
    export function onTravelled(cb: () => void): void {
        control.onEvent(16, 22, function () {
            cb()
        })
    }

    //% block block="⛏️プレイヤーがメッセージを受信したとき"
    //% group="Event"
    export function onMessage(cb: () => void): void {
        control.onEvent(17, 22, function () {
            cb()
        })
    }

    // Notifications from the PC arrive as newline-terminated lines.
    // Protocol v2 frames (MB:ev:<EventName>*<CRC>) are verified and
    // dispatched; legacy bare event names still work.
    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let line = serial.readLine()
        // Strip trailing CR/LF in case the line reader keeps them.
        while (line.length > 0 && (line.charAt(line.length - 1) == "\n" || line.charAt(line.length - 1) == "\r")) {
            line = line.substr(0, line.length - 1)
        }
        if (line.substr(0, 3) == "MB:") {
            // Protocol v2 frame: verify the checksum before use.
            let star = -1
            for (let i = 0; i < line.length; i++) {
                if (line.charAt(i) == "*") {
                    star = i
                }
            }
            if (star < 0) {
                return
            }
            const body = line.substr(0, star)
            if (hex2(crc8(body)) != line.substr(star + 1)) {
                return
            }
            const rest = body.substr(3)
            const colon = rest.indexOf(":")
            if (colon < 0) {
                return
            }
            const kind = rest.substr(0, colon)
            const payload = rest.substr(colon + 1)
            if (kind == "ev") {
                dispatchEvent(payload)
            } else if (kind == "hello" || kind == "state") {
                v2Synced = true
            }
            return
        }
        // Legacy v1 notification lines are still accepted, so this
        // program also works during a mixed-version transition.
        dispatchEvent(line)
    })

    /**
     * Run Minecraft Command.
     * @param ChoiceCommand options
     */
    //% blockId=run_mccommand block="⛏️マイクラコマンド実行 %ChoiceCommand | %options"
    //% weight=80
    //% group="Command"
    export function Run_mccommand(choice: ChoiceCommand, options: string):void {
        let commandName
        switch(choice) {
            case ChoiceCommand.tp:
                commandName = "tp"
                break
            case ChoiceCommand.give:
                commandName = "give"
                break
            case ChoiceCommand.execute:
                commandName = "execute"
                break
            case ChoiceCommand.summon:
                commandName = "summon"
                break
            case ChoiceCommand.effect:
                commandName = "effect"
                break
            case ChoiceCommand.fill:
                commandName = "fill"
                break
            case ChoiceCommand.playsound:
                commandName = "playsound"
                break
            case ChoiceCommand.weather:
                commandName = "weather"
                break
            case ChoiceCommand.time:
                commandName = "time"
                break
        }
        let command = "/" + commandName + " " + options
        sendMCCommand(command)
    }

    /**
     * Gathering Minecraft Entity.
     * @param void
     */
    //% blockId=gatheringEntity block="⛏️エンティティ全員集合"
    //% weight=80
    //% group="Command"
    export function gatheringEntity(): void {
        let command = "/tp @e @s"
        sendMCCommand(command)
    }

    /**
     * Run Minecraft Command.
     * @param ChoiceCommand options
     */
    //% blockId=mccommandText block="⛏️マイクラコマンド文字列 %ChoiceCommand | %options"
    //% weight=80
    //% group="Command"
    export function mccommandText(choice: ChoiceCommand, options: string): string {
        let commandName
        switch (choice) {
            case ChoiceCommand.tp:
                commandName = "tp"
                break
            case ChoiceCommand.give:
                commandName = "give"
                break
            case ChoiceCommand.execute:
                commandName = "execute"
                break
            case ChoiceCommand.summon:
                commandName = "summon"
                break
            case ChoiceCommand.effect:
                commandName = "effect"
                break
            case ChoiceCommand.fill:
                commandName = "fill"
                break
            case ChoiceCommand.playsound:
                commandName = "playsound"
                break
            case ChoiceCommand.weather:
                commandName = "weather"
                break
            case ChoiceCommand.time:
                commandName = "time"
                break
        }
        let command = "/" + commandName + " " + options
        return command
    }

    /**
     * Generate Relative coordinates
     * @param ChoiceCommand options
     */
    //% blockId=Rcoordinates block="⛏️相対座標 ~%rx | ~%ry | ~%rz"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function setRXYZ(rx: number, ry: number, rz: number):string {
        let RXYZ = "~" + rx + " " + "~" + ry + " " + "~" + rz + " "
        return RXYZ
    }

    /**
     * Generate Relative coordinates
     * @param ChoiceCommand options
     */
    //% blockId=makeMcComStr block="⛏️コマンド文字 %str"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function makeMcString(str: string): string {
        let mcStr = " " + str + " "
        return mcStr
    }


    /**
     * Command Target
     * @param Target
     */
    //% blockId=TargetBlock block="⛏️実行対象 %Target"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function setTarget(target: Target):string {
        switch (target) {
            case Target.a:
                return " @a ";
            case Target.c:
                return " @c ";
            case Target.e:
                return " @e ";
            case Target.p:
                return " @p ";
            case Target.r:
                return " @r ";
            case Target.s:
                return " @s ";
            default:
                return " @s ";
        }
    }

    /**
     * Command Target with type
     * @param Target
     */
    //% blockId=TargetBlockType block="⛏️実行対象 %Target[type=%type]"
    //% weight=80
    //% draggableParameters
    //% group="Command"
    export function setTargetType(target: Target, type: string): string {
        switch (target) {
            case Target.a:
                return " @a[type=" + type + "] ";
            case Target.c:
                return " @c[type=" + type + "] ";
            case Target.e:
                return " @e[type=" + type + "] ";
            case Target.p:
                return " @p[type=" + type + "] ";
            case Target.r:
                return " @r[type=" + type + "] ";
            case Target.s:
                return " @s[type=" + type + "] ";
            default:
                return " @s[type=" + type + "] ";
        }
    }

    /**
     * Send Minecraft KeyMouseEvent.
     * @param KeyMouseEvent
     */
    //% blockId=send_mckmevent block="⛏️操作イベント送信 %KeyMouseEvent"
    //% weight=80
    //% group="Event"
    /**
    export function send_mcKeyMouseEvent(kmEvent: KeyMouseEvent): void {
        let commandName
        switch (kmEvent) {
            case KeyMouseEvent.left:
                commandName = "l"
                break
            case KeyMouseEvent.right:
                commandName = "r"
                break
            case KeyMouseEvent.w:
                commandName = "w"
                break
            case KeyMouseEvent.a:
                commandName = "a"
                break
            case KeyMouseEvent.s:
                commandName = "s"
                break
            case KeyMouseEvent.d:
                commandName = "d"
                break
            case KeyMouseEvent.L:
                commandName = "L"
                break
            case KeyMouseEvent.R:
                commandName = "R"
                break
            case KeyMouseEvent.j:
                commandName = "j"
                break
            case KeyMouseEvent.k:
                commandName = "k"
                break
        }
        let command = commandName
        sendMCCommand(command)
    }
     */

    /**
     * 
     */
    //% blockId="mcev_choice" block="⛏️イベント選択 %ChoiceEvent"
    //% weight=100 color=#000080 blockGap=20
    //% group="Event"
    export function choiceEvent(cEvent: ChoiceEvent): void {
        if (cEvent == ChoiceEvent.unsubsc) {
            desiredSubs = []
            sendV2("unsub", "all")
            return
        }
        let eventName = ""
        switch (cEvent) {
            case ChoiceEvent.ptravelled:
                eventName = "PlayerTravelled"
                break
            case ChoiceEvent.blockplaced:
                eventName = "BlockPlaced"
                break
            case ChoiceEvent.blockbroken:
                eventName = "BlockBroken"
                break
            case ChoiceEvent.itemused:
                eventName = "ItemUsed"
                break
            case ChoiceEvent.itemdropped:
                eventName = "ItemDropped"
                break
            case ChoiceEvent.message:
                eventName = "PlayerMessage"
                break
            case ChoiceEvent.teleported:
                eventName = "PlayerTeleported"
                break
        }
        if (eventName.length == 0) {
            return
        }
        if (desiredSubs.indexOf(eventName) < 0) {
            desiredSubs.push(eventName)
        }
        sendV2("sub", eventName)
    }
}