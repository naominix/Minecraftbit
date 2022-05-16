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
    Minecraftbit.Run_mccommand(ChoiceCommand.tp, "" + Minecraftbit.setTarget(Target.e) + Minecraftbit.setRXYZ(0, 5, 0))
})
Minecraftbit.onTravelled(function () {
	
})
Minecraftbit.onItemUsed(function () {
    Minecraftbit.sendMCCommand("/tp ~~~")
})
Minecraftbit.connect()
