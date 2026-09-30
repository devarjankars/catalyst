$file = 'd:\eB\email_builder2\app\builder\page.tsx'
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$old = 'const [showVersionPanel, setShowVersionPanel] = useState(false);'
$new = 'const [showVersionPanel, setShowVersionPanel] = useState(false);' + "`r`n  const [rightTab, setRightTab] = useState<'properties' | 'versions'>('properties');"
$c2 = $c.Replace($old, $new)
[System.IO.File]::WriteAllText($file, $c2, [System.Text.Encoding]::UTF8)
Write-Host "Done"
