package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

// AtomCmd is the parent command for atom-related operations
var AtomCmd = &cobra.Command{
	Use:   "atom",
	Short: "Atomization, audit, and verification tools",
}

func init() {
	RootCmd.AddCommand(AtomCmd)
	AtomCmd.AddCommand(buildAtomizedCmd)
	AtomCmd.AddCommand(auditCollapseCmd)
	AtomCmd.AddCommand(verifyDAGCmd)
}

var buildAtomizedCmd = &cobra.Command{
	Use:   "build",
	Short: "Run compiler atomization pass",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("[FAB] Running compiler atomization pass...")

		// Execute: fabc --atomized input.fb -o build/atomized.json
		input := "input.fb"
		output := "build/atomized.json"
		cmdExec := exec.Command("fabc", "--atomized", input, "-o", output)
		cmdExec.Stdout = os.Stdout
		cmdExec.Stderr = os.Stderr

		if err := cmdExec.Run(); err != nil {
			log.Fatalf("Compiler failed: %v", err)
		}

		if _, err := os.Stat(output); os.IsNotExist(err) {
			log.Fatalf("Atomized output not found at %s", output)
		}

		fmt.Println("✅ Atomized structure stored at:", output)
	},
}

var auditCollapseCmd = &cobra.Command{
	Use:   "audit",
	Short: "Audit superposition collapse traces",
	Run: func(cmd *cobra.Command, args []string) {
		tracePath := "audit/collapse_trace.log"
		fmt.Println("[FAB] Auditing collapse trace...")

		data, err := ioutil.ReadFile(tracePath)
		if err != nil {
			log.Fatalf("Failed to read collapse trace: %v", err)
		}

		fmt.Println("\nCollapse Trace Log\n-------------------")
		fmt.Println(string(data))
	},
}

var verifyDAGCmd = &cobra.Command{
	Use:   "verify",
	Short: "Replay and verify mutation DAG",
	Run: func(cmd *cobra.Command, args []string) {
		dagFile := "audit/dag.json"
		fmt.Println("[FAB] Replaying and validating DAG...")

		data, err := ioutil.ReadFile(dagFile)
		if err != nil {
			log.Fatalf("Failed to read DAG file: %v", err)
		}

		var mutations []map[string]interface{}
		if err := json.Unmarshal(data, &mutations); err != nil {
			log.Fatalf("Invalid DAG format: %v", err)
		}

		seen := make(map[string]bool)
		for i, m := range mutations {
			id := fmt.Sprintf("%v", m["id"])
			parent := fmt.Sprintf("%v", m["parent"])
			if i == 0 && parent != "" {
				log.Fatalf("First node must not have a parent, found %s", parent)
			}
			if i > 0 && !seen[parent] {
				log.Fatalf("Missing parent %s for node %s", parent, id)
			}
			seen[id] = true
		}

		fmt.Printf("✅ DAG verified: %d nodes, no missing links.\n", len(mutations))
	},
}
