Minecraftbit.onBlockPlaced(function () {
    basic.showIcon(IconNames.Square)
})
Minecraftbit.onItemDropped(function () {
    basic.showIcon(IconNames.Chessboard)
})
Minecraftbit.onBlockBroken(function () {
    basic.showIcon(IconNames.No)
})
input.onButtonPressed(Button.A, function () {
    Minecraftbit.Run_mccommand(ChoiceCommand.execute, "" + Minecraftbit.setTargetType(Target.e, "player") + Minecraftbit.setRXYZ(0, 0, 0) + Minecraftbit.mccommandText(ChoiceCommand.effect, Minecraftbit.setTarget(Target.s)) + Minecraftbit.makeMcString("night_vision") + Minecraftbit.makeMcString("6000") + Minecraftbit.makeMcString("55") + Minecraftbit.makeMcString("false"))
})
Minecraftbit.onTravelled(function () {
	
})
Minecraftbit.onItemUsed(function () {
	
})
Minecraftbit.connect()
